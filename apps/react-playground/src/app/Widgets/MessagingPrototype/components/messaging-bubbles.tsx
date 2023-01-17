import Deso from 'deso-protocol';
import { DecryptedMessageEntryResponse } from 'deso-protocol-types';
import { DecryptedResponse } from '../consts/constants';
import { MessagingDisplayAvatar } from './messaging-display-avatar';

export interface MessagingBubblesProps {
  conversations: { [k: string]: DecryptedMessageEntryResponse };
  conversationPublicKey: string;
  deso: Deso;
}
export const MessagingBubblesAndAvatar: React.FC<{
  conversations: { [k: string]: DecryptedMessageEntryResponse };
  conversationPublicKey: string;
  deso: Deso;
}> = ({
  conversations,
  conversationPublicKey,
  deso,
}: MessagingBubblesProps) => {
  if (Object.keys(conversations).length === 0 || conversationPublicKey === '') {
    return <div></div>;
  }
  // TODO: fetch rest of convo
  const conversation = [conversations[conversationPublicKey]] ?? [];
  return (
    <div>
      {conversation.map((message, i: number) => {
        const messageToShow = message.DecryptedMessage || message.error;
        let senderStyles = 'bg-blue-500';
        if (!message.IsSender) {
          senderStyles = 'bg-green-500';
        }
        if (message.error) {
          senderStyles = 'bg-red-500';
        }
        return (
          <div
            className={`mx-2 ${
              message.IsSender ? 'ml-auto justify-end' : 'mr-auto justify-start'
            }  max-w-[400px] mb-4 flex`}
            key={`message-${i}`}
          >
            {!message.IsSender && (
              <MessagingDisplayAvatar
                publicKey={message.SenderInfo.OwnerPublicKeyBase58Check}
                timeStamp={message.MessageInfo.TimestampNanos}
                deso={deso}
                diameter={50}
              />
            )}
            <div
              className={`${senderStyles}  mt-auto mb-5 p-2 rounded-lg bg-blue-500 text-white break-words max-w-[250px]`}
            >
              {messageToShow}
            </div>
            {message.IsSender && (
              <MessagingDisplayAvatar
                publicKey={message.SenderInfo.OwnerPublicKeyBase58Check}
                timeStamp={message.MessageInfo.TimestampNanos}
                deso={deso}
                diameter={50}
              />
            )}
          </div>
        );
      })}
      ,
    </div>
  );
};
