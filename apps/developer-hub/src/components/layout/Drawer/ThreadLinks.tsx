/* eslint-disable @typescript-eslint/ban-types */
import Deso from 'deso-protocol';
import { ReactElement, useEffect, useState } from 'react';
import {
  forumRoute,
  getForumPosts,
  groupBy,
  HUB,
  ThreadCategory,
} from '../../../services/utils';
import { PostEntryResponse } from 'deso-protocol-types';
import { DrawerLink } from './DrawerLink';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
const deso = new Deso();

export interface ThreadLinksProps {
  openedPanels: any;
  parentRouteClick: Function;
}
export const ThreadLinks = ({
  openedPanels,
  parentRouteClick,
}: ThreadLinksProps) => {
  const [threads, setThreads] = useState<ReactElement[]>([]);
  const getThreads = async () => {
    const forumPosts = await await getForumPosts();
    const threads =
      forumPosts
        // .filter((p) => p.Body === 'General')
        .map((p, index) => {
          return (
            <DrawerLink
              category={p.PostExtraData['Category'] as ThreadCategory}
              index={`${index}`}
              to={forumRoute(p)}
              title={p.Body}
            />
          );
        }) ?? [];
    const groupedThreads = groupBy(threads, 'category');
    const threadsToDisplay = Object.entries(groupedThreads).map(
      (group, index) => {
        const [key, links] = group;
        return (
          <div>
            <div
              key={index}
              className="py-2 px-4 text-md font-medium  cursor-pointer hover:underline"
              onClick={() => parentRouteClick(key)}
            >
              <div className="inline flex justify-start mr-20">
                {openedPanels[key] ? <ArrowDropDownIcon /> : <ArrowRightIcon />}
                <div>{key.toLowerCase()}</div>
              </div>
            </div>
            {openedPanels[key] ? links : ''}
          </div>
        );
      }
    );
    setThreads(threadsToDisplay);
  };
  useEffect(() => {
    getThreads();
  }, [parentRouteClick]);
  return <>{threads}</>;
};
