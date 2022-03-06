import {
  GetDecryptMessagesResponse,
  IdentityJwtResponse,
  IdentityLoginResponse,
  LoginUser,
} from '@deso-workspace/deso-types';
import { Node } from '../../index';
import {
  approveSignAndSubmit,
  callIdentityMethodAndExecute,
  getIframe,
} from './IdentityHelper';
import { requestLogin, requestLogout } from './WindowPrompts';
export class Identity {
  node: Node;
  constructor(node: Node) {
    this.node = node;
  }
  private initialized = false;

  public getIframe(): HTMLIFrameElement {
    return getIframe();
  }

  public getUser(): LoginUser | null {
    const user = localStorage.getItem('login_user');
    if (user) {
      return JSON.parse(user);
    }
    return null;
  }

  public async initialize(): Promise<any> {
    if (this.getIframe()) {
      return;
    }
    return new Promise((resolve) => {
      const windowHandler = (event: any) => {
        if (event.origin !== 'https://identity.deso.org') {
          return;
        }
        if (event.data.method === 'initialize') {
          event.source.postMessage(
            {
              id: event.data.id,
              service: 'identity',
              payload: {},
            },
            'https://identity.deso.org' as WindowPostMessageOptions
          );

          resolve(event.data);
        }
      };
      window.addEventListener('message', windowHandler);
      this.initialized = true;

      this.setIdentityFrame(true);
    });
  }

  public login(accessLevel = '4'): Promise<IdentityLoginResponse> {
    const prompt = requestLogin();
    return new Promise((resolve, reject) => {
      const windowHandler = ({ data }: { data: IdentityLoginResponse }) => {
        if (data.method !== 'login') {
          return;
        }
        const key = data.payload.publicKeyAdded;
        const user = data.payload.users[key];
        prompt?.close();
        localStorage.setItem('login_user', JSON.stringify(user));
        resolve(data);

        window.removeEventListener('message', windowHandler);
      };
      window.addEventListener('message', windowHandler);
    });
  }

  public logout(publicKey: string): Promise<boolean> {
    const prompt = requestLogout(publicKey);
    return new Promise((resolve, reject) => {
      const windowHandler = (event: any) => {
        if (event.data.method === 'login') {
          prompt?.close();
          resolve(true);

          localStorage.setItem('login_user', '');
        }
      };
      window.addEventListener('message', windowHandler);
    });
  }

  private setIdentityFrame(createNewIdentityFrame = false): void {
    let frame = document.getElementById('identity');
    if (frame && createNewIdentityFrame) {
      frame.remove();
    }
    if (!createNewIdentityFrame) {
      return;
    }
    frame = document.createElement('iframe');
    frame.setAttribute('src', 'https://identity.deso.org/embed?v=2');
    frame.setAttribute('id', 'identity');
    frame.style.width = '100vh';
    frame.style.height = '100vh';
    frame.style.position = 'fixed';
    frame.style.zIndex = '1000';
    frame.style.display = 'none';
    frame.style.left = '0';
    frame.style.right = '0';

    const root = document.getElementsByTagName('body')[0];
    if (root) {
      root.appendChild(frame);
    }
  }

  public async submitTransaction(TransactionHex: string) {
    const user = this.getUser();
    // user exists no need to approve
    if (user) {
      return callIdentityMethodAndExecute(TransactionHex, 'sign');
    } else {
      // user does not exist  get approval
      return approveSignAndSubmit(TransactionHex);
    }
  }

  public async decrypt(
    encryptedMessages: any[]
  ): Promise<GetDecryptMessagesResponse[]> {
    let user = this.getUser();
    if (!user) {
      // throw Error('need to login first');
      await this.login();
      user = this.getUser();
    }
    return await callIdentityMethodAndExecute(encryptedMessages, 'decrypt');
    // if (!request?.payload?.encryptedMessage) {
    //   throw Error('Encrypted Messages are were not Included');
    // }
    // const iframe = this.getIframe();
    // if (iframe === null) {
    //   throw Error('Iframe with id identity does not exist');
    // }
    // iframe.contentWindow?.postMessage(request, '*');
    // return new Promise((resolve) => {
    //   const windowHandler = (event: any) => {
    //     if (!event?.data?.payload?.decryptedHexes) {
    //       return;
    //     }
    //     const decryptedHexes = event?.data?.payload?.decryptedHexes;
    //     const messages = request.payload?.encryptedMessage;
    //     const thread = (messages as GetDecryptMessagesResponse[])?.map((m) => {
    //       const DecryptedMessage = decryptedHexes[m.EncryptedHex];
    //       return { ...m, DecryptedMessage };
    //     });
    //     resolve(thread);
    //   };
    //   window.addEventListener('message', windowHandler);
    // });
  }

  public async getJwt(): Promise<string> {
    let user = this.getUser();
    if (!user) {
      const response = await this.login().catch((e) => {
        throw e;
      });
      const key = response.payload.publicKeyAdded;
      user = response.payload.users[key];
    }
    // const request = getJwtInfo({ ...user });
    // this.getIframe().contentWindow?.postMessage(request, '*');
    return new Promise((resolve, reject) => {
      const windowHandler = ({ data }: { data: IdentityJwtResponse }) => {
        console.log(data);
        if (data.payload.jwt) {
          resolve(data.payload.jwt);
          window.removeEventListener('message', windowHandler);
        }
      };
      window.addEventListener('message', windowHandler);
    });
  }
}
