import { PartialWithRequiredFields } from '@deso-core/data';
import {
  AddAccessGroupMembersRequest,
  AddAccessGroupMembersResponse,
  CreateAccessGroupRequest,
  CreateAccessGroupResponse,
  RequestOptions,
} from 'deso-protocol-types';
import {
  constructBalanceModelTx,
  ConstructedTransactionResponse,
  convertExtraData,
  handleSignAndSubmit,
  TxRequestWithOptionalFeesAndExtraData,
} from '../internal';
import { ConstructedAndSubmittedTx } from '../types';
import {
  AccessGroupMemberRecord,
  TransactionExtraData,
  TransactionMetadataAccessGroup,
  TransactionMetadataAccessGroupMembers,
  bs58PublicKeyToCompressedBytes,
  encodeUTF8ToBytes,
} from '@deso-core/identity';

/**
 * https://docs.deso.org/deso-backend/construct-transactions/access-groups-api#create-access-group
 */
export type CreateAccessGroupRequestParams =
  TxRequestWithOptionalFeesAndExtraData<
    PartialWithRequiredFields<
      CreateAccessGroupRequest,
      | 'AccessGroupOwnerPublicKeyBase58Check'
      | 'AccessGroupKeyName'
      | 'AccessGroupPublicKeyBase58Check'
    >
  >;
export const createAccessGroup = (
  params: CreateAccessGroupRequestParams,
  options?: RequestOptions<
    CreateAccessGroupRequestParams,
    CreateAccessGroupResponse
  >
): Promise<ConstructedAndSubmittedTx<CreateAccessGroupResponse>> => {
  return handleSignAndSubmit('api/v0/create-access-group', params, {
    ...options,
    constructionFunction: constructCreateAccessGroupTransaction,
  });
};

export const constructCreateAccessGroupTransaction = (
  params: CreateAccessGroupRequestParams
): Promise<ConstructedTransactionResponse> => {
  const metadata = new TransactionMetadataAccessGroup();
  metadata.accessGroupPublicKey = bs58PublicKeyToCompressedBytes(
    params.AccessGroupPublicKeyBase58Check
  );
  metadata.accessGroupOwnerPublicKey = bs58PublicKeyToCompressedBytes(
    params.AccessGroupOwnerPublicKeyBase58Check
  );
  // TODO: do we want to make an enum for all these operation types somewhere?
  metadata.accessGroupOperationType = 2;
  // TODO: how to properly parse this?
  metadata.accessGroupKeyName = encodeUTF8ToBytes(params.AccessGroupKeyName);
  return constructBalanceModelTx(
    params.AccessGroupOwnerPublicKeyBase58Check,
    metadata,
    {
      ExtraData: params.ExtraData,
      MinFeeRateNanosPerKB: params.MinFeeRateNanosPerKB,
      TransactionFees: params.TransactionFees,
    }
  );
};

/**
 * https://docs.deso.org/deso-backend/construct-transactions/access-groups-api#update-access-group
 */
export type UpdateAccessGroupRequestParams =
  TxRequestWithOptionalFeesAndExtraData<
    PartialWithRequiredFields<
      CreateAccessGroupRequest,
      | 'AccessGroupOwnerPublicKeyBase58Check'
      | 'AccessGroupKeyName'
      | 'AccessGroupPublicKeyBase58Check'
    >
  >;
export const updateAccessGroup = (
  params: UpdateAccessGroupRequestParams,
  options?: RequestOptions<
    UpdateAccessGroupRequestParams,
    CreateAccessGroupResponse
  >
): Promise<ConstructedAndSubmittedTx<CreateAccessGroupResponse>> => {
  return handleSignAndSubmit('api/v0/update-access-group', params, {
    ...options,
    constructionFunction: constructUpdateAccessGroupTransaction,
  });
};

export const constructUpdateAccessGroupTransaction = (
  params: UpdateAccessGroupRequestParams
): Promise<ConstructedTransactionResponse> => {
  const metadata = new TransactionMetadataAccessGroup();
  metadata.accessGroupPublicKey = bs58PublicKeyToCompressedBytes(
    params.AccessGroupPublicKeyBase58Check
  );
  metadata.accessGroupOwnerPublicKey = bs58PublicKeyToCompressedBytes(
    params.AccessGroupOwnerPublicKeyBase58Check
  );
  // TODO: do we want to make an enum for all these operation types somewhere?
  metadata.accessGroupOperationType = 3;
  // TODO: how to properly parse this?
  metadata.accessGroupKeyName = encodeUTF8ToBytes(params.AccessGroupKeyName);
  return constructBalanceModelTx(
    params.AccessGroupOwnerPublicKeyBase58Check,
    metadata,
    {
      ExtraData: params.ExtraData,
      MinFeeRateNanosPerKB: params.MinFeeRateNanosPerKB,
      TransactionFees: params.TransactionFees,
    }
  );
};

/**
 * https://docs.deso.org/deso-backend/construct-transactions/access-groups-api#add-access-group-members
 */
export const addAccessGroupMembers = (
  params: TxRequestWithOptionalFeesAndExtraData<AddAccessGroupMembersRequest>,
  options?: RequestOptions<
    TxRequestWithOptionalFeesAndExtraData<AddAccessGroupMembersRequest>,
    AddAccessGroupMembersResponse
  >
): Promise<ConstructedAndSubmittedTx<AddAccessGroupMembersResponse>> => {
  return handleSignAndSubmit('api/v0/add-access-group-members', params, {
    ...options,
    constructionFunction: constructAddAccessGroupMembersTransaction,
  });
};

export const constructAddAccessGroupMembersTransaction = (
  params: TxRequestWithOptionalFeesAndExtraData<AddAccessGroupMembersRequest>
): Promise<ConstructedTransactionResponse> => {
  const metadata = new TransactionMetadataAccessGroupMembers();
  metadata.accessGroupOwnerPublicKey = bs58PublicKeyToCompressedBytes(
    params.AccessGroupOwnerPublicKeyBase58Check
  );
  metadata.accessGroupMemberOperationType = 2;
  metadata.accessGroupKeyName = encodeUTF8ToBytes(params.AccessGroupKeyName);
  metadata.accessGroupMembersList = params.AccessGroupMemberList.map(
    (member) => {
      const newAccessGroupMember = new AccessGroupMemberRecord();
      newAccessGroupMember.accessGroupMemberPublicKey =
        bs58PublicKeyToCompressedBytes(
          member.AccessGroupMemberPublicKeyBase58Check
        );
      newAccessGroupMember.accessGroupMemberKeyName = encodeUTF8ToBytes(
        member.AccessGroupMemberKeyName
      );
      // TODO: make sure we're probably reading this?
      newAccessGroupMember.encryptedKey = encodeUTF8ToBytes(
        member.EncryptedKey
      );
      newAccessGroupMember.extraData = convertExtraData(member.ExtraData);
      return newAccessGroupMember;
    }
  );
  return constructBalanceModelTx(
    params.AccessGroupOwnerPublicKeyBase58Check,
    metadata,
    {
      ExtraData: params.ExtraData,
      MinFeeRateNanosPerKB: params.MinFeeRateNanosPerKB,
      TransactionFees: params.TransactionFees,
    }
  );
};

/**
 * https://docs.deso.org/deso-backend/construct-transactions/access-groups-api#remove-access-group-members
 */
export const removeAccessGroupMembers = (
  params: TxRequestWithOptionalFeesAndExtraData<AddAccessGroupMembersRequest>,
  options?: RequestOptions<
    TxRequestWithOptionalFeesAndExtraData<AddAccessGroupMembersRequest>,
    AddAccessGroupMembersResponse
  >
): Promise<ConstructedAndSubmittedTx<AddAccessGroupMembersResponse>> => {
  return handleSignAndSubmit('api/v0/remove-access-group-members', params, {
    ...options,
    constructionFunction: constructRemoveAccessGroupMembersTransaction,
  });
};

export const constructRemoveAccessGroupMembersTransaction = (
  params: TxRequestWithOptionalFeesAndExtraData<AddAccessGroupMembersRequest>
): Promise<ConstructedTransactionResponse> => {
  const metadata = new TransactionMetadataAccessGroupMembers();
  metadata.accessGroupOwnerPublicKey = bs58PublicKeyToCompressedBytes(
    params.AccessGroupOwnerPublicKeyBase58Check
  );
  metadata.accessGroupMemberOperationType = 3;
  metadata.accessGroupKeyName = encodeUTF8ToBytes(params.AccessGroupKeyName);
  metadata.accessGroupMembersList = params.AccessGroupMemberList.map(
    (member) => {
      const newAccessGroupMember = new AccessGroupMemberRecord();
      newAccessGroupMember.accessGroupMemberPublicKey =
        bs58PublicKeyToCompressedBytes(
          member.AccessGroupMemberPublicKeyBase58Check
        );
      newAccessGroupMember.accessGroupMemberKeyName = encodeUTF8ToBytes(
        params.AccessGroupKeyName
      );
      newAccessGroupMember.encryptedKey = new Uint8Array(0);
      newAccessGroupMember.extraData = new TransactionExtraData();
      return newAccessGroupMember;
    }
  );
  return constructBalanceModelTx(
    params.AccessGroupOwnerPublicKeyBase58Check,
    metadata,
    {
      ExtraData: params.ExtraData,
      MinFeeRateNanosPerKB: params.MinFeeRateNanosPerKB,
      TransactionFees: params.TransactionFees,
    }
  );
};

/**
 * https://docs.deso.org/deso-backend/construct-transactions/access-groups-api#update-access-group-members
 */
export const updateAccessGroupMembers = (
  params: TxRequestWithOptionalFeesAndExtraData<AddAccessGroupMembersRequest>,
  options?: RequestOptions<
    TxRequestWithOptionalFeesAndExtraData<AddAccessGroupMembersRequest>,
    AddAccessGroupMembersResponse
  >
): Promise<ConstructedAndSubmittedTx<AddAccessGroupMembersResponse>> => {
  return handleSignAndSubmit(
    'api/v0/update-access-group-members',
    params,
    options
  );
};

export const constructUpdateAccessGroupMembersTransaction = (
  params: TxRequestWithOptionalFeesAndExtraData<AddAccessGroupMembersRequest>
): Promise<ConstructedTransactionResponse> => {
  const metadata = new TransactionMetadataAccessGroupMembers();
  metadata.accessGroupOwnerPublicKey = bs58PublicKeyToCompressedBytes(
    params.AccessGroupOwnerPublicKeyBase58Check
  );
  metadata.accessGroupMemberOperationType = 4;
  metadata.accessGroupKeyName = encodeUTF8ToBytes(params.AccessGroupKeyName);
  metadata.accessGroupMembersList = params.AccessGroupMemberList.map(
    (member) => {
      const newAccessGroupMember = new AccessGroupMemberRecord();
      newAccessGroupMember.accessGroupMemberPublicKey =
        bs58PublicKeyToCompressedBytes(
          member.AccessGroupMemberPublicKeyBase58Check
        );
      newAccessGroupMember.accessGroupMemberKeyName = encodeUTF8ToBytes(
        member.AccessGroupMemberKeyName
      );
      // TODO: make sure we're probably reading this?
      newAccessGroupMember.encryptedKey = encodeUTF8ToBytes(
        member.EncryptedKey
      );
      newAccessGroupMember.extraData = convertExtraData(member.ExtraData);
      return newAccessGroupMember;
    }
  );
  return constructBalanceModelTx(
    params.AccessGroupOwnerPublicKeyBase58Check,
    metadata,
    {
      ExtraData: params.ExtraData,
      MinFeeRateNanosPerKB: params.MinFeeRateNanosPerKB,
      TransactionFees: params.TransactionFees,
    }
  );
};
