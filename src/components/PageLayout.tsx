import {NavLink, Outlet} from 'react-router-dom';
import React from 'react';
import config from '../config';
import {Breadcrumb, Layout, Menu} from 'antd';
import Icon, {AuditOutlined, LoginOutlined, LogoutOutlined, SettingOutlined, SolutionOutlined} from '@ant-design/icons';
import '../i18n/config';
import { useTranslation } from 'react-i18next';

const { Content, Header, Sider } = Layout;

const PageLayout = () => {
  const { t } = useTranslation();

  return (
    <Layout>
      <Header className='header'>
        <div className='logo' />
        <Menu theme='dark' mode='horizontal' defaultSelectedKeys={['portal']}>
          <Menu.Item key='portal'>
            <NavLink to={config.PATH_ROOT + '/'}>
              <SolutionOutlined />
              <span>{t('Portal')}</span>
            </NavLink>
          </Menu.Item>
          <Menu.Item key='admin'>
            <NavLink to={config.PATH_ROOT + '/admin'}>
              <SettingOutlined />
              <span>{t('Admin')}</span>
            </NavLink>
          </Menu.Item>
          <Menu.Item key='teams'>
            <NavLink to={config.PATH_ROOT + '/admin/teams'}>
              <SettingOutlined />
              <span>{t('Teams')}</span>
            </NavLink>
          </Menu.Item>
          <Menu.Item key='users'>
            <NavLink to={config.PATH_ROOT + '/admin/users'}>
              <SettingOutlined />
              <span>{t('Users')}</span>
            </NavLink>
          </Menu.Item>
          <Menu.Item key='login'>
            <NavLink to={config.PATH_ROOT + '/login'}>
              <LoginOutlined />
              <span>{t('Login')}</span>
            </NavLink>
          </Menu.Item>
          <Menu.Item key='logout'>
            <NavLink to={config.PATH_ROOT + '/logout'}>
              <LogoutOutlined />
              <span>{t('Logout')}</span>
            </NavLink>
          </Menu.Item>
        </Menu>
      </Header>
      <Layout>
        <Sider width={200} className='site-layout-background' collapsible={true} defaultCollapsed={true}
               collapsedWidth={0}>
          <Menu
            mode='inline'
            defaultSelectedKeys={['/school/portal/test-result-summary']}
            defaultOpenKeys={['sub1']}
            style={{ height: '100%', borderRight: 0 }}
          >
            <Menu.Item icon={<AuditOutlined />} key='/school/portal/test-result-summary'>
              <NavLink to='/school/portal/test-result-summary'>
                <Icon type='home' />
                <span>{t('Test result summary')}</span>
              </NavLink>
            </Menu.Item>
          </Menu>
        </Sider>
        <Layout style={{ padding: '0 24px 24px' }}>
          <Breadcrumb style={{ margin: '16px 0' }}>
            <Breadcrumb.Item>{t('Portal')}</Breadcrumb.Item>
            <Breadcrumb.Item>{t('Test result summary')}</Breadcrumb.Item>
          </Breadcrumb>
          <Content
            className='site-layout-background'
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}

export {PageLayout};
