import { PartialWithRequiredFields } from '@deso-core/data';
import {
  AuthorizeDerivedKeyRequest,
  AuthorizeDerivedKeyResponse,
  RequestOptions,
} from 'deso-protocol-types';
import {
  constructBalanceModelTx,
  ConstructedTransactionResponse,
  handleSignAndSubmit,
  TxRequestWithOptionalFeesAndExtraData,
} from '../internal';
import { ConstructedAndSubmittedTx } from '../types';
import {
  bs58PublicKeyToCompressedBytes,
  encodeUTF8ToBytes,
  TransactionExtraDataKV,
  TransactionMetadataAuthorizeDerivedKey,
} from '@deso-core/identity';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';

/**
 * https://docs.deso.org/deso-backend/construct-transactions/derived-keys-transaction-api#authorize-derived-key
 */
export type AuthorizeDerivedKeyRequestParams =
  TxRequestWithOptionalFeesAndExtraData<
    PartialWithRequiredFields<
      AuthorizeDerivedKeyRequest,
      | 'OwnerPublicKeyBase58Check'
      | 'DerivedPublicKeyBase58Check'
      | 'TransactionSpendingLimitHex'
      | 'Memo'
      | 'ExpirationBlock'
    >
  >;
export const authorizeDerivedKey = (
  params: AuthorizeDerivedKeyRequestParams,
  options?: RequestOptions
): Promise<ConstructedAndSubmittedTx<AuthorizeDerivedKeyResponse>> => {
  return handleSignAndSubmit('api/v0/authorize-derived-key', params, {
    ...options,
    constructionFunction: constructAuthorizeDerivedKey,
  });
};

export const constructAuthorizeDerivedKey = (
  params: AuthorizeDerivedKeyRequestParams
): Promise<ConstructedTransactionResponse> => {
  const metadata = new TransactionMetadataAuthorizeDerivedKey();
  metadata.accessSignature = hexToBytes(params.AccessSignature || '');
  metadata.derivedPublicKey = bs58PublicKeyToCompressedBytes(
    params.DerivedPublicKeyBase58Check
  );
  metadata.expirationBlock = params.ExpirationBlock;
  metadata.operationType = params.DeleteKey ? 0 : 1;
  const consensusExtraDataKVs: TransactionExtraDataKV[] = [];
  // TODO: this is a poorly named param, should probably fix this.
  if (params.DerivedKeySignature) {
    const derivedKeyKV = new TransactionExtraDataKV();
    derivedKeyKV.key = encodeUTF8ToBytes('DerivedPublicKey');
    derivedKeyKV.value = bs58PublicKeyToCompressedBytes(
      params.DerivedPublicKeyBase58Check
    );
    consensusExtraDataKVs.push(derivedKeyKV);
  }
  if (params.TransactionSpendingLimitHex) {
    const transactionSpendingLimitBuf = hexToBytes(
      params.TransactionSpendingLimitHex
    );
    if (transactionSpendingLimitBuf.length) {
      const spendingLimitKV = new TransactionExtraDataKV();
      spendingLimitKV.key = encodeUTF8ToBytes('TransactionSpendingLimit');
      spendingLimitKV.value = transactionSpendingLimitBuf;
      consensusExtraDataKVs.push(spendingLimitKV);
    }
  }
  if (params.Memo || params.AppName) {
    const memo = params.Memo || (params.AppName as string);
    const memoKV = new TransactionExtraDataKV();
    memoKV.key = encodeUTF8ToBytes('DerivedKeyMemo');
    // TODO: I think this is wrong, but need to double check
    memoKV.value = encodeUTF8ToBytes(bytesToHex(encodeUTF8ToBytes(memo)));
  }
  return constructBalanceModelTx(params.OwnerPublicKeyBase58Check, metadata, {
    ConsensusExtraDataKVs: consensusExtraDataKVs,
    ExtraData: params.ExtraData,
    MinFeeRateNanosPerKB: params.MinFeeRateNanosPerKB,
    TransactionFees: params.TransactionFees,
  });
};
