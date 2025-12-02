// Frontend: src/pages/LoginPage.tsx (updated: form for legacy, button for OIDC; no auto-trigger)
import React, { useEffect } from 'react';
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
  const { signin, signinOIDC, authMode, user } = useAuth() as any;
  const {t} = useTranslation();
  // Determine where to return after login: router state or query param (?fromPage=)
  const stateFrom = location.state?.from?.pathname as string | undefined;
  const qs = new URLSearchParams(location.search);
  const qsFromRaw = qs.get('fromPage') || undefined;
  let qsFrom: string | undefined;
  if (qsFromRaw) {
    try {
      const decoded = decodeURIComponent(qsFromRaw);
      const url = new URL(decoded, window.location.origin);
      qsFrom = url.pathname + url.search + url.hash;
    } catch {
      // Fallback: if it looks like a relative path, accept it
      qsFrom = qsFromRaw.startsWith('/') ? qsFromRaw : undefined;
    }
  }
  const fromPage = stateFrom || qsFrom || '/';

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
    // Preserve intended route across redirects
    if (fromPage) sessionStorage.setItem('postLoginRedirect', fromPage);
    Promise.resolve(signinOIDC())
      .catch((e: any) => message.error(e?.message || 'Authentication failed'));
  };

  // If user already authenticated (e.g., after redirect), go to intended page
  useEffect(() => {
    if (user) {
      const stored = sessionStorage.getItem('postLoginRedirect');
      const target = stored || fromPage || '/';
      if (stored) sessionStorage.removeItem('postLoginRedirect');
      if (location.pathname !== target) {
        navigate(target, { replace: true });
      }
    }
  }, [user]);

  // Show error if MSAL/IdP redirected back with an error
  useEffect(() => {
    try {
      const qs = new URLSearchParams(window.location.search);
      const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
      const hs = new URLSearchParams(hash);
      const err = qs.get('error') || hs.get('error');
      const desc = qs.get('error_description') || hs.get('error_description');
      if (err || desc) {
        message.error(decodeURIComponent(desc || err || 'Authentication failed'));
      }
    } catch {}
  }, []);

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
