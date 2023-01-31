import axios from 'axios';
import {
  BuyOrSellCreatorCoinRequest,
  BuyOrSellCreatorCoinResponse,
  RequestOptions,
  SendDeSoRequest,
  SendDeSoResponse,
  TransferCreatorCoinRequest,
  TransferCreatorCoinResponse,
} from 'deso-protocol-types';
import {
  DeSoProtocolSubmitTransactionResponse,
  Identity,
} from '../identity/Identity';

import { Node } from '../Node/Node';

export class Wallet {
  private node: Node;
  private identity: Identity;
  constructor(node: Node, identity: Identity) {
    this.node = node;
    this.identity = identity;
  }

  public async sendDesoRequest(
    request: Partial<SendDeSoRequest>,
    options?: RequestOptions
  ): Promise<SendDeSoResponse & DeSoProtocolSubmitTransactionResponse> {
    const endpoint = 'send-deso';
    const apiResponse: SendDeSoResponse = (
      await axios.post(`${this.node.getUri()}/${endpoint}`, request)
    ).data;
    return await this.identity
      .submitTransaction(apiResponse.TransactionHex, options)
      .then((stRes) => ({ ...apiResponse, ...stRes }))
      .catch(() => {
        throw Error('something went wrong while signing');
      });
  }

  public async buyOrSellCreatorCoin(
    request: Partial<BuyOrSellCreatorCoinRequest>,
    options?: RequestOptions
  ): Promise<
    BuyOrSellCreatorCoinResponse & DeSoProtocolSubmitTransactionResponse
  > {
    const endpoint = 'buy-or-sell-creator-coin';
    const apiResponse: BuyOrSellCreatorCoinResponse = (
      await axios.post(`${this.node.getUri()}/${endpoint}`, request)
    ).data;
    return await this.identity
      .submitTransaction(apiResponse.TransactionHex, options)
      .then((stRes) => ({ ...apiResponse, ...stRes }))
      .catch(() => {
        throw Error('something went wrong while signing');
      });
  }

  public async transferCreatorCoin(
    request: Partial<TransferCreatorCoinRequest>,
    options?: RequestOptions
  ): Promise<
    TransferCreatorCoinResponse & DeSoProtocolSubmitTransactionResponse
  > {
    const endpoint = 'transfer-creator-coin';
    const apiResponse: TransferCreatorCoinResponse = (
      await axios.post(`${this.node.getUri()}/${endpoint}`, request)
    ).data;
    return await this.identity
      .submitTransaction(apiResponse.TransactionHex, options)
      .then((stRes) => ({ ...apiResponse, ...stRes }))
      .catch(() => {
        throw Error('something went wrong while signing');
      });
  }
}
