// Frontend: src/pages/LoginPage.tsx (updated: form for legacy, button for OIDC; no auto-trigger)
import React from 'react';
import {useLocation, useNavigate} from "react-router-dom";
import {Button, Form, Input, Layout, message} from 'antd';
import {useTranslation} from 'react-i18next';
import {LoginOutlined} from '@ant-design/icons';
import {useAuth} from "../hook/useAuth";  // Hook for context

const {Content} = Layout;
const layout = {
  labelCol: {span: 8},
  wrapperCol: {span: 16}
};
const tailLayout = {
  wrapperCol: {offset: 8, span: 16}
};

type FieldType = {
  username?: string;
  password?: string;
};

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signin, signinOIDC, authMode } = useAuth();
  const {t} = useTranslation();
  const fromPage = location.state?.from?.pathname || '/';

  const onFinish = async (values: FieldType) => {
    // Legacy signin
    signin(values.username!, () => {
      message.success('Login succeeded');
      navigate(fromPage, {replace: true});
    });
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo);
  };

  const handleOIDCLogin = () => {
    signinOIDC(() => {
      message.success('Login succeeded');
      navigate(fromPage, {replace: true});
    });
  };

  // If already authenticated (e.g., after redirect), go home
  if (authMode && fromPage !== '/login') {
    navigate(fromPage || '/', {replace: true});
    return null;
  }

  return (
    <Layout>
      <Layout style={{padding: '0 24px 24px'}}>
        <Content
          className='site-layout-background'
          style={{
            padding: 24,
            margin: 0,
            minHeight: 280
          }}
        >
          <Form
            {...layout}
            name='basic'
            initialValues={{remember: true}}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            style={{ maxWidth: 600, margin: '0 auto' }}
          >
            <Form.Item<FieldType>
              label={t('Username')}
              name='username'
              rules={[{required: true, message: t('Please input your username!')}]}
            >
              <Input/>
            </Form.Item>

            <Form.Item<FieldType>
              label={t('Password')}
              name='password'
              rules={[{required: true, message: t('Please input your password!')}]}
            >
              <Input.Password/>
            </Form.Item>

            <Form.Item {...tailLayout}>
              <Button type='primary' htmlType='submit' style={{ marginRight: 8 }}>
                <LoginOutlined/>
                {t('Log in')}
              </Button>
              <Button onClick={handleOIDCLogin} type='default'>
                <LoginOutlined/>
                {t('Log in with')}
              </Button>
            </Form.Item>
          </Form>
        </Content>
      </Layout>
    </Layout>
  )
}

export {LoginPage};
