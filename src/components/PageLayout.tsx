import {NavLink, Outlet} from 'react-router-dom';
import {Layout, Menu} from 'antd';
import Icon, {AuditOutlined} from '@ant-design/icons';
import '../i18n/config';
import {useTranslation} from 'react-i18next';
import {MainMenu} from "./MainMenu";

const {Content, Header, Sider} = Layout;

const PageLayout = () => {
  const {t} = useTranslation();

  return (
    <Layout>
      <Header className='header'>
        <div className='logo'/>
        <MainMenu/>
      </Header>
      <Layout>
        <Sider width={200} className='site-layout-background' collapsible={true} defaultCollapsed={true}
               collapsedWidth={0}>
          <Menu
            mode='inline'
            defaultSelectedKeys={['/portal/chat']}
            defaultOpenKeys={['sub1']}
            style={{height: '100%', borderRight: 0}}
          >
            <Menu.Item icon={<AuditOutlined/>} key='/portal/chat'>
              <NavLink to='/portal/chat'>
                <Icon type='home'/>
                <span>{t('Chat')}</span>
              </NavLink>
            </Menu.Item>
          </Menu>
        </Sider>
        <Layout>
          <Content
            className='site-layout-background'
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280
            }}
          >
            <Outlet/>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}

export {PageLayout};
