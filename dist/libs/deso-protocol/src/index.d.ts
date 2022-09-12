import { DAO } from './lib/dao/dao';
import { Identity, IdentityConfig } from './lib/identity/Identity';
import { Media } from './lib/media/Media';
import { MetaData } from './lib/meta-data/MetaData';
import { Ethereum } from './lib/metamask/Ethereum';
import { Miner } from './lib/miner/Miner';
import { Nft } from './lib/nft/Nft';
import { Node } from './lib/Node/Node';
import { Notification } from './lib/notification/Notification';
import { Posts } from './lib/post/Posts';
import { Referral } from './lib/referral/Referral';
import { Social } from './lib/social/Social';
import { Transactions } from './lib/transaction/Transaction';
import { User } from './lib/user/User';
import { Wallet } from './lib/wallet/Wallet';
import * as Utils from './lib/utils/Utils';
export { Ethereum as Metamask } from './lib/metamask/Ethereum';
export interface DesoConfig {
    nodeUri?: string;
    identityConfig?: Partial<IdentityConfig>;
}
export declare class Deso {
    constructor(config?: Partial<DesoConfig>);
    node: Node;
    transaction: Transactions;
    identity: Identity;
    private admin;
    media: Media;
    metaData: MetaData;
    miner: Miner;
    nft: Nft;
    notification: Notification;
    user: User;
    social: Social;
    dao: DAO;
    posts: Posts;
    wallet: Wallet;
    referral: Referral;
    ethereum: Ethereum;
    utils: typeof Utils;
    reinitialize(): void;
}
export default Deso;
