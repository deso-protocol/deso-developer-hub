import { PartialWithRequiredFields } from '@deso-core/data';
import {
  AcceptNFTBidRequest,
  AcceptNFTBidResponse,
  AcceptNFTTransferRequest,
  AcceptNFTTransferResponse,
  BurnNFTRequest,
  BurnNFTResponse,
  CreateNFTBidRequest,
  CreateNFTBidResponse,
  CreateNFTRequest,
  CreateNFTResponse,
  RequestOptions,
  TransferNFTRequest,
  TransferNFTResponse,
  UpdateNFTRequest,
  UpdateNFTResponse,
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
  concatUint8Arrays,
  TransactionExtraDataKV,
  TransactionMetadataAcceptNFTBid,
  TransactionMetadataAcceptNFTTransfer,
  TransactionMetadataBurnNFT,
  TransactionMetadataCreateNFT,
  TransactionMetadataNFTBid,
  TransactionMetadataNFTTransfer,
  TransactionMetadataUpdateNFT,
  uvarint64ToBuf,
} from '@deso-core/identity';
import { hexToBytes } from '@noble/hashes/utils';

/**
 * https://docs.deso.org/deso-backend/construct-transactions/nft-transactions-api#create-nft
 */
export type CreateNFTRequestParams = TxRequestWithOptionalFeesAndExtraData<
  PartialWithRequiredFields<
    CreateNFTRequest,
    | 'UpdaterPublicKeyBase58Check'
    | 'NFTPostHashHex'
    | 'NumCopies'
    | 'NFTRoyaltyToCoinBasisPoints'
    | 'NFTRoyaltyToCreatorBasisPoints'
    | 'HasUnlockable'
    | 'IsForSale'
  >
>;

export const createNFT = async (
  params: CreateNFTRequestParams,
  options?: RequestOptions
): Promise<ConstructedAndSubmittedTx<CreateNFTResponse>> => {
  return handleSignAndSubmit('api/v0/create-nft', params, {
    ...options,
    constructionFunction: constructCreateNFTTransaction,
  });
};

export const constructCreateNFTTransaction = (
  params: CreateNFTRequestParams
): Promise<ConstructedTransactionResponse> => {
  const metadata = new TransactionMetadataCreateNFT();
  metadata.hasUnlockable = params.HasUnlockable;
  metadata.isForSale = params.IsForSale;
  metadata.minBidAmountNanos = params.MinBidAmountNanos || 0;
  metadata.nftPostHash = hexToBytes(params.NFTPostHashHex);
  metadata.nftRoyaltyToCoinBasisPoints = params.NFTRoyaltyToCoinBasisPoints;
  metadata.nftRoyaltyToCreatorBasisPoints =
    params.NFTRoyaltyToCreatorBasisPoints;
  metadata.numCopies = params.NumCopies;

  const consensusExtraDataKVs: TransactionExtraDataKV[] = [];
  if (params.IsBuyNow && params.BuyNowPriceNanos !== undefined) {
    const buyNowKV = new TransactionExtraDataKV();
    buyNowKV.key = hexToBytes('BuyNowPriceNanos');
    buyNowKV.value = uvarint64ToBuf(params.BuyNowPriceNanos);
    consensusExtraDataKVs.push(buyNowKV);
  }
  if (
    params.AdditionalDESORoyaltiesMap &&
    Object.keys(params.AdditionalDESORoyaltiesMap).length
  ) {
    const royaltyMap = params.AdditionalDESORoyaltiesMap;
    let buf = uvarint64ToBuf(Object.keys(royaltyMap).length);
    Object.keys(royaltyMap)
      .sort((a, b) => a.localeCompare(b))
      .forEach((publicKey) => {
        buf = concatUint8Arrays([
          buf,
          bs58PublicKeyToCompressedBytes(publicKey),
          uvarint64ToBuf(royaltyMap[publicKey]),
        ]);
      });
    const additionalDESORoyaltyMapKV = new TransactionExtraDataKV();
    additionalDESORoyaltyMapKV.key = hexToBytes('DESORoyaltiesMap');
    additionalDESORoyaltyMapKV.value = buf;
    consensusExtraDataKVs.push(additionalDESORoyaltyMapKV);
  }
  if (
    params.AdditionalCoinRoyaltiesMap &&
    Object.keys(params.AdditionalCoinRoyaltiesMap).length
  ) {
    const royaltyMap = params.AdditionalCoinRoyaltiesMap;
    let buf = uvarint64ToBuf(Object.keys(royaltyMap).length);
    Object.keys(royaltyMap)
      .sort((a, b) => a.localeCompare(b))
      .forEach((publicKey) => {
        buf = concatUint8Arrays([
          buf,
          bs58PublicKeyToCompressedBytes(publicKey),
          uvarint64ToBuf(royaltyMap[publicKey]),
        ]);
      });
    const additionalCoinRoyaltyMapKV = new TransactionExtraDataKV();
    additionalCoinRoyaltyMapKV.key = hexToBytes('CoinRoyaltiesMap');
    additionalCoinRoyaltyMapKV.value = buf;
    consensusExtraDataKVs.push(additionalCoinRoyaltyMapKV);
  }
  return constructBalanceModelTx(params.UpdaterPublicKeyBase58Check, metadata, {
    ExtraData: params.ExtraData,
    ConsensusExtraDataKVs: consensusExtraDataKVs,
    MinFeeRateNanosPerKB: params.MinFeeRateNanosPerKB,
    TransactionFees: params.TransactionFees,
  });
};

/**
 * https://docs.deso.org/deso-backend/construct-transactions/nft-transactions-api#update-nft
 */
export type UpdateNFTRequestParams = TxRequestWithOptionalFeesAndExtraData<
  PartialWithRequiredFields<
    UpdateNFTRequest,
    | 'UpdaterPublicKeyBase58Check'
    | 'NFTPostHashHex'
    | 'SerialNumber'
    | 'MinBidAmountNanos'
  >
>;
export const updateNFT = async (
  params: UpdateNFTRequestParams,
  options?: RequestOptions
): Promise<ConstructedAndSubmittedTx<UpdateNFTResponse>> => {
  return handleSignAndSubmit('api/v0/update-nft', params, {
    ...options,
    constructionFunction: constructUpdateNFTTransaction,
  });
};

export const constructUpdateNFTTransaction = (
  params: UpdateNFTRequestParams
): Promise<ConstructedTransactionResponse> => {
  const metadata = new TransactionMetadataUpdateNFT();
  metadata.isForSale = !!params.IsForSale;
  metadata.minBidAmountNanos = params.MinBidAmountNanos;
  metadata.nftPostHash = hexToBytes(params.NFTPostHashHex);
  metadata.serialNumber = params.SerialNumber;
  const consensusExtraDataKVs: TransactionExtraDataKV[] = [];
  if (params.IsBuyNow && params.BuyNowPriceNanos !== undefined) {
    const buyNowKV = new TransactionExtraDataKV();
    buyNowKV.key = hexToBytes('BuyNowPriceNanos');
    buyNowKV.value = uvarint64ToBuf(params.BuyNowPriceNanos);
    consensusExtraDataKVs.push(buyNowKV);
  }
  return constructBalanceModelTx(params.UpdaterPublicKeyBase58Check, metadata, {
    ExtraData: params.ExtraData,
    MinFeeRateNanosPerKB: params.MinFeeRateNanosPerKB,
    TransactionFees: params.TransactionFees,
    ConsensusExtraDataKVs: consensusExtraDataKVs,
  });
};
/**
 * https://docs.deso.org/deso-backend/construct-transactions/nft-transactions-api#create-nft-bid
 */
export type CreateNFTBidRequestParams = TxRequestWithOptionalFeesAndExtraData<
  PartialWithRequiredFields<
    CreateNFTBidRequest,
    | 'BidAmountNanos'
    | 'NFTPostHashHex'
    | 'SerialNumber'
    | 'UpdaterPublicKeyBase58Check'
  >
>;
export const createNFTBid = (
  params: CreateNFTBidRequestParams,
  options?: RequestOptions
): Promise<ConstructedAndSubmittedTx<CreateNFTBidResponse>> => {
  return handleSignAndSubmit('api/v0/create-nft-bid', params, {
    ...options,
    constructionFunction: constructNFTBidTransaction,
  });
};

export const constructNFTBidTransaction = (
  params: CreateNFTBidRequestParams
): Promise<ConstructedTransactionResponse> => {
  const metadata = new TransactionMetadataNFTBid();
  metadata.bidAmountNanos = params.BidAmountNanos;
  metadata.nftPostHash = hexToBytes(params.NFTPostHashHex);
  metadata.serialNumber = params.SerialNumber;
  return constructBalanceModelTx(params.UpdaterPublicKeyBase58Check, metadata, {
    MinFeeRateNanosPerKB: params.MinFeeRateNanosPerKB,
    ExtraData: params.ExtraData,
    TransactionFees: params.TransactionFees,
  });
};

/**
 * https://docs.deso.org/deso-backend/construct-transactions/nft-transactions-api#accept-nft-bid
 */
export type AcceptNFTBidRequestParams = TxRequestWithOptionalFeesAndExtraData<
  PartialWithRequiredFields<
    AcceptNFTBidRequest,
    | 'BidAmountNanos'
    | 'NFTPostHashHex'
    | 'SerialNumber'
    | 'UpdaterPublicKeyBase58Check'
    | 'BidderPublicKeyBase58Check'
  >
>;
export const acceptNFTBid = (
  params: AcceptNFTBidRequestParams,
  options?: RequestOptions
): Promise<ConstructedAndSubmittedTx<AcceptNFTBidResponse>> => {
  return handleSignAndSubmit('api/v0/accept-nft-bid', params, {
    ...options,
    constructionFunction: constructAcceptNFTBidTransaction,
  });
};

export const constructAcceptNFTBidTransaction = (
  params: AcceptNFTBidRequestParams
): Promise<ConstructedTransactionResponse> => {
  const metadata = new TransactionMetadataAcceptNFTBid();
  metadata.bidAmountNanos = params.BidAmountNanos;
  metadata.bidderInputs = [];
  // TODO: this won't work if they've had their identity swapped.
  metadata.bidderPKID = bs58PublicKeyToCompressedBytes(
    params.BidderPublicKeyBase58Check
  );
  metadata.encryptedUnlockableText = hexToBytes(
    params.EncryptedUnlockableText || ''
  );
  metadata.nftPostHash = hexToBytes(params.NFTPostHashHex);
  metadata.serialNumber = params.SerialNumber;
  return constructBalanceModelTx(params.UpdaterPublicKeyBase58Check, metadata, {
    MinFeeRateNanosPerKB: params.MinFeeRateNanosPerKB,
    ExtraData: params.ExtraData,
    TransactionFees: params.TransactionFees,
  });
};

/**
 * https://docs.deso.org/deso-backend/construct-transactions/nft-transactions-api#transfer-nft
 */
export type TransferNFTRequestParams = TxRequestWithOptionalFeesAndExtraData<
  PartialWithRequiredFields<
    TransferNFTRequest,
    | 'SenderPublicKeyBase58Check'
    | 'ReceiverPublicKeyBase58Check'
    | 'NFTPostHashHex'
    | 'SerialNumber'
  >
>;
export const transferNFT = (
  params: TransferNFTRequestParams,
  options?: RequestOptions
): Promise<ConstructedAndSubmittedTx<TransferNFTResponse>> => {
  return handleSignAndSubmit('api/v0/transfer-nft', params, {
    ...options,
    constructionFunction: constructTransferNFT,
  });
};

export const constructTransferNFT = (
  params: TransferNFTRequestParams
): Promise<ConstructedTransactionResponse> => {
  const metadata = new TransactionMetadataNFTTransfer();
  metadata.encryptedUnlockableText = hexToBytes(
    params.EncryptedUnlockableText || ''
  );
  metadata.nftPostHash = hexToBytes(params.NFTPostHashHex);
  metadata.receiverPublicKey = bs58PublicKeyToCompressedBytes(
    params.ReceiverPublicKeyBase58Check
  );
  metadata.serialNumber = params.SerialNumber;
  return constructBalanceModelTx(params.SenderPublicKeyBase58Check, metadata, {
    MinFeeRateNanosPerKB: params.MinFeeRateNanosPerKB,
    ExtraData: params.ExtraData,
    TransactionFees: params.TransactionFees,
  });
};

/**
 * https://docs.deso.org/deso-backend/construct-transactions/nft-transactions-api#accept-nft-transfer
 */
export type AcceptNFTTransferRequestParams =
  TxRequestWithOptionalFeesAndExtraData<
    PartialWithRequiredFields<
      AcceptNFTTransferRequest,
      'UpdaterPublicKeyBase58Check' | 'NFTPostHashHex' | 'SerialNumber'
    >
  >;
export const acceptNFTTransfer = (
  params: AcceptNFTTransferRequestParams,
  options?: RequestOptions
): Promise<ConstructedAndSubmittedTx<AcceptNFTTransferResponse>> => {
  return handleSignAndSubmit('api/v0/accept-nft-transfer', params, {
    ...options,
    constructionFunction: constructAcceptNFTTransfer,
  });
};

export const constructAcceptNFTTransfer = (
  params: AcceptNFTTransferRequestParams
): Promise<ConstructedTransactionResponse> => {
  const metadata = new TransactionMetadataAcceptNFTTransfer();
  metadata.nftPostHash = hexToBytes(params.NFTPostHashHex);
  metadata.serialNumber = params.SerialNumber;
  return constructBalanceModelTx(params.UpdaterPublicKeyBase58Check, metadata, {
    ExtraData: params.ExtraData,
    MinFeeRateNanosPerKB: params.MinFeeRateNanosPerKB,
    TransactionFees: params.TransactionFees,
  });
};

/**
 * https://docs.deso.org/deso-backend/construct-transactions/nft-transactions-api#burn-nft
 */
export type BurnNFTRequestParams = TxRequestWithOptionalFeesAndExtraData<
  PartialWithRequiredFields<
    BurnNFTRequest,
    'UpdaterPublicKeyBase58Check' | 'NFTPostHashHex' | 'SerialNumber'
  >
>;
export const burnNFT = (
  params: BurnNFTRequestParams,
  options?: RequestOptions
): Promise<ConstructedAndSubmittedTx<BurnNFTResponse>> => {
  return handleSignAndSubmit('api/v0/burn-nft', params, options);
};

export const constructBurnNFTTransation = (
  params: BurnNFTRequestParams
): Promise<ConstructedTransactionResponse> => {
  const metadata = new TransactionMetadataBurnNFT();
  metadata.nftPostHash = hexToBytes(params.NFTPostHashHex);
  metadata.serialNumber = params.SerialNumber;
  return constructBalanceModelTx(params.UpdaterPublicKeyBase58Check, metadata, {
    ExtraData: params.ExtraData,
    MinFeeRateNanosPerKB: params.MinFeeRateNanosPerKB,
    TransactionFees: params.TransactionFees,
  });
};
