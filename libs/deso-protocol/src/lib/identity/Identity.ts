import {
  AppendExtraDataRequest,
  DerivedPrivateUserInfo,
  DeSoNetwork,
  GetDecryptMessagesRequest,
  GetDecryptMessagesResponse,
  IdentityDeriveParams,
  IdentityDeriveQueryParams,
  LoginUser,
  RequestOptions,
  SendMessageStatelessRequest,
} from 'deso-protocol-types';
import { convertExtraDataToHex } from '../../utils/utils';
import { Node } from '../Node/Node';
import { BASE_IDENTITY_URI } from '../state/BaseUri';
import { Transactions } from '../transaction/Transaction';
import {
  approveSignAndSubmit,
  callIdentityMethodAndExecute,
  getIframe,
} from './IdentityHelper';
import { iFrameHandler } from './WindowHandler';
import { requestDerive, requestLogin, requestLogout } from './WindowPrompts';
const SERVER_ERROR: Readonly<string> =
  'You cannot call identity Iframe in a sever application, in the options parameter set broadcast to false';
export interface IdentityConfig {
  node: Node;
  uri?: string;
  network?: DeSoNetwork;
  host?: 'browser' | 'server';
}

export class Identity {
  private node: Node;
  private network: DeSoNetwork;
  private identityUri = BASE_IDENTITY_URI;
  private loggedInUser: LoginUser | null = null;
  private loggedInKey = '';
  private transactions: Transactions;
  public host: 'browser' | 'server';
  constructor(
    { host = 'browser', node, network, uri }: IdentityConfig,
    transactions: Transactions
  ) {
    this.host = host;
    this.node = node;
    this.network = network || DeSoNetwork.mainnet;
    this.transactions = transactions;
    if (this.host === 'browser') {
      const user = localStorage.getItem('deso_user');
      const key = localStorage.getItem('deso_user_key');
      if (user) {
        this.setUser(JSON.parse(user));
        const oy = JSON.parse(user);
        console.log(oy);
        console.log('user', this.getUser());
      }
      if (key) {
        this.setLoggedInKey(key);
      }
    }
    this.setUri(uri ?? BASE_IDENTITY_URI);
  }

  public getUri(): string {
    return this.identityUri;
  }

  public setUri(uri: string): void {
    this.identityUri = uri;
    if (this.host === 'browser') {
      localStorage.setItem('deso_identity_uri', this.identityUri);
    }
  }

  public getIframe(): HTMLIFrameElement {
    return getIframe();
  }

  public getUser(): LoginUser | null {
    return this.loggedInUser;
  }

  private setUser(user: LoginUser | null): void {
    this.loggedInUser = user;
    if (this.host === 'browser' && user) {
      localStorage.setItem('deso_user', JSON.stringify(user));
    }
  }

  public getUserKey(): string | null {
    return this.loggedInKey;
  }

  private setLoggedInKey(key: string) {
    this.loggedInKey = key;
    if (this.host === 'browser') {
      localStorage.setItem('deso_user_key', key);
    }
  }
  //  end of getters/ setters

  public async initialize(): Promise<any> {
    if (this.host === 'server') throw Error(SERVER_ERROR);

    if (this.getIframe()) {
      return;
    }
    return new Promise((resolve) => {
      const windowHandler = (event: any) => {
        if (event.origin !== this.getUri()) {
          return;
        }
        if (event.data.method === 'initialize') {
          event.source.postMessage(
            {
              id: event.data.id,
              service: 'identity',
              payload: {},
            },
            this.getUri()
          );
          resolve(event.data);
        }
      };
      window.addEventListener('message', windowHandler);
      this.setIdentityFrame(true);
    });
  }

  public async login(
    accessLevel = '4'
  ): Promise<{ user: LoginUser; key: string }> {
    if (this.host === 'server') throw Error(SERVER_ERROR);
    const prompt = requestLogin(accessLevel, this.getUri(), this.isTestnet());
    const { key, user } = await iFrameHandler(
      {
        iFrameMethod: 'login',
        data: { prompt },
      },
      this.transactions
    );
    this.setUser(user);
    this.setLoggedInKey(key);
    return { user, key };
  }

  public async logout(publicKey: string): Promise<boolean> {
    if (this.host === 'server') throw Error(SERVER_ERROR);
    if (typeof publicKey !== 'string') {
      throw Error('publicKey needs to be type of string');
    }
    const prompt = requestLogout(publicKey, this.getUri(), this.isTestnet());
    const successful = await iFrameHandler(
      {
        iFrameMethod: 'logout',
        data: { prompt },
      },
      this.transactions
    );
    this.setUser(null);
    this.setLoggedInKey('');
    return successful;
  }

  public async derive(
    params: IdentityDeriveParams
  ): Promise<DerivedPrivateUserInfo> {
    if (this.host === 'server') throw Error(SERVER_ERROR);
    const queryParams: IdentityDeriveQueryParams = {
      callback: params.callback,
      webview: params.webview,
      publicKey: params.publicKey,
      transactionSpendingLimitResponse: params.transactionSpendingLimitResponse
        ? encodeURIComponent(
            JSON.stringify(params.transactionSpendingLimitResponse)
          )
        : undefined,
      derivedPublicKey: params.derivedPublicKey,
      deleteKey: params.deleteKey,
      expirationDays: params.expirationDays,
    };
    const prompt = requestDerive(queryParams, this.getUri(), this.isTestnet());
    const derivedPrivateUser: DerivedPrivateUserInfo = await iFrameHandler(
      {
        iFrameMethod: 'derive',
        data: { prompt },
      },

      this.transactions
    );
    return derivedPrivateUser;
  }

  private setIdentityFrame(createNewIdentityFrame = false): void {
    if (this.host === 'server') throw Error(SERVER_ERROR);
    let frame = document.getElementById('identity');
    if (frame && createNewIdentityFrame) {
      frame.remove();
    }
    if (!createNewIdentityFrame) {
      return;
    }
    frame = document.createElement('iframe');
    frame.setAttribute('src', `${this.getUri()}/embed?v=2`);
    frame.setAttribute('id', 'identity');
    frame.style.width = '100vh';
    frame.style.height = '100vh';
    frame.style.position = 'fixed';
    frame.style.zIndex = '1000';
    frame.style.display = 'none';
    frame.style.left = '0';
    frame.style.top = '0';
    const root = document.getElementsByTagName('body')[0];
    if (root) {
      root.appendChild(frame);
    }
  }

  public async submitTransaction(
    TransactionHex: string,
    options: RequestOptions = { broadcast: this.host === 'browser' },
    extraData?: Omit<AppendExtraDataRequest, 'TransactionHex'>
  ) {
    // don't submit the transaction, instead just return the api response from the
    // previous call
    if (options?.broadcast === false) return;
    // server app? then you can't call the iframe
    if (this.host === 'server') throw Error(SERVER_ERROR);
    if (extraData?.ExtraData && Object.keys(extraData?.ExtraData).length > 0) {
      TransactionHex = (
        await this.transactions.appendExtraData({
          TransactionHex: TransactionHex,
          ExtraData: convertExtraDataToHex(extraData).ExtraData,
        })
      ).TransactionHex;
    }
    const user = this.getUser();
    // user exists no need to approve
    if (user) {
      return callIdentityMethodAndExecute(
        TransactionHex,
        'sign',
        user,
        this.transactions
      );
    } else {
      // user does not exist  get approval
      return approveSignAndSubmit(
        TransactionHex,
        this.getUri(),
        this.transactions,
        this.isTestnet()
      );
    }
  }

  public async decrypt(
    encryptedMessages: GetDecryptMessagesRequest[]
  ): Promise<GetDecryptMessagesResponse[]> {
    if (this.host === 'server') throw Error(SERVER_ERROR);
    let user = this.getUser();
    if (!user) {
      await this.login();
      user = this.getUser();
    }
    return await callIdentityMethodAndExecute(
      encryptedMessages,
      'decrypt',
      this.getUser(),
      this.transactions
    );
  }

  public async encrypt(
    request: Partial<SendMessageStatelessRequest>
  ): Promise<string> {
    if (this.host === 'server') throw Error(SERVER_ERROR);
    request.RecipientPublicKeyBase58Check;
    let user = this.getUser();
    if (!user) {
      await this.login();
      user = this.getUser();
    }
    return await callIdentityMethodAndExecute(
      request,
      'encrypt',
      this.getUser(),
      this.transactions
    );
  }

  public async getJwt(): Promise<string> {
    if (this.host === 'server') throw Error(SERVER_ERROR);
    let user = this.getUser();
    if (!user) {
      user = (await this.login()).user;
    }
    return await callIdentityMethodAndExecute(
      undefined,
      'jwt',
      this.getUser(),
      this.transactions
    );
  }
  private isTestnet(): boolean {
    return this.network === DeSoNetwork.testnet;
  }
}
