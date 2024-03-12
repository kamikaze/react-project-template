import {t} from 'i18next';
import {Avatar, Input, List, Space} from 'antd';
import React, {useEffect, useRef, useState} from 'react';
import Title from 'antd/lib/typography/Title';
import config from '../config';
import useWebSocket from "react-use-websocket";
import {RobotOutlined, UserOutlined} from "@ant-design/icons";
import styles from './ChartPage.module.scss';

const {TextArea} = Input;

interface IMessage {
  id: string;
  reply_to: string;
  timestamp: string;
  username: string;
  message: string;
  metadata?: string[];
  type?: 'user' | 'bot';
}

const ChatPage = () => {
  const [socketUrl, setSocketUrl] = useState(config.WS_URL);
  const [messageHistory, setMessageHistory] = useState<IMessage[]>([]);
  const {sendMessage, lastMessage, readyState} = useWebSocket(socketUrl);
  // const [dataSource, setDataSource] = useState([]);
  // const [loading, setLoading] = useState<boolean>(false);
  const [textAreaValue, setTextAreaValue] = useState<string>('');
  const anchor = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    if (lastMessage !== null) {
      const data = JSON.parse(lastMessage.data);
      setMessageHistory((prev) => prev.concat(data));
      // message.info(data.username + ': ' + data.message).then();
    }
  }, [lastMessage, setMessageHistory]);

  useEffect(() => {
    if (anchor !== null && anchor.current !== null) {
      anchor.current.scrollIntoView({behavior: 'smooth'});
    }
  }, [messageHistory]);

  const onPressEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey) {
      const msg = e.currentTarget.value.trim();

      if (msg !== '') {
        const newMessageHistory = messageHistory.concat([{
          id: (messageHistory.length + 1).toString(),
          reply_to: '0',
          timestamp: new Date().toISOString(),
          username: 'demo-user',
          message: msg,
          type: 'user'
        }
          /*
          ,{
            id: (messageHistory.length + 2).toString(),
            reply_to: (messageHistory.length + 1).toString(),
            timestamp: new Date().toISOString(),
            username: 'bot',
            message: 'Pudding cookie cheesecake apple pie danish sweet roll. Liquorice chocolate cake bonbon tiramisu cupcake caramels sweet roll sugar plum icing. Tiramisu cookie candy jujubes oat cake chupa chups. Tiramisu tiramisu danish wafer halvah sweet shortbread muffin macaroon.',
          }
          */
        ]);

        setTextAreaValue('');
        setMessageHistory(newMessageHistory);
        const payload = {message: msg, username: 'demo-user'};
        sendMessage(JSON.stringify(payload));
      }
    }
  };

  const onTextAreaChage = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextAreaValue(e.target.value);
  }

  return (
    <div className={styles.chat_container}>
      <Title level={2}>{t('Chat')}</Title>
      <div
        className={styles.chat_messagesWrapper}
      >
        <List
          dataSource={messageHistory}
          itemLayout="vertical"
          className={styles.chat_list}
          renderItem={(item) => (
            <List.Item key={item.id} className={styles.chat_list_item}>
              <div className={item.type === 'user' ? styles.chat_list_userMessage : styles.chat_list_botMessage}>
                <List.Item.Meta
                  avatar={<Avatar src={item.type === 'user' ? <UserOutlined/> : <RobotOutlined/>}/>}
                />
                <div
                  className={item.type === 'user' ? styles.chat_list_userMessage_content : styles.chat_list_botMessage_content}>{item.message}</div>
              </div>
            </List.Item>
          )}
        >
          <div ref={anchor}/>
        </List>
      </div>
      <Space size='middle' direction='vertical' style={{width: '100%'}}>
        <TextArea
          value={textAreaValue}
          onChange={onTextAreaChage}
          showCount
          maxLength={1000}
          style={{height: 120, resize: 'none'}}
          onPressEnter={onPressEnter}
          placeholder='Start your conversation here'
        />
      </Space>
    </div>
  )
}

export {ChatPage};
