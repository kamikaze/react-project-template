import {Navigate} from "react-router-dom";
import {Button, Layout, Spin} from 'antd';
import {useTranslation} from 'react-i18next';
import config from '../config';
import {LoginOutlined} from '@ant-design/icons';
import {useAuth} from "../hook/useAuth";

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
  const {signin, isAuthenticated, isLoading} = useAuth();
  const {t} = useTranslation();

  if (isLoading) {
    return <Spin fullscreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Content style={{ flex: 'none' }}>
        <Button type='primary' size="large" onClick={() => signin()}>
          <LoginOutlined/>
          {t('Log in with OIDC')}
        </Button>
      </Content>
    </Layout>
  )
}

export {LoginPage};
