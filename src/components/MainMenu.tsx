import {Menu, Popover} from "antd";
import {NavLink, useLocation, useNavigate} from "react-router-dom";
import config from "../config";
import {
  AlignCenterOutlined,
  BulbOutlined,
  HomeOutlined,
  LoginOutlined,
  LogoutOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined
} from "@ant-design/icons";
import React, {useState} from "react";
import {useAuth} from "../hook/useAuth";
import {useTranslation} from "react-i18next";

const MainMenu = () => {
  const {user, signout} = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [language, setLanguage] = useState<string>('US');
  const {t, i18n} = useTranslation();
  const rightAlignedMenuItem = {marginLeft: 'auto'};

  const onLangClick = (info: any) => {
    setLanguage(info.key.toUpperCase());
    i18n.changeLanguage(info.key);
  }

  return (
    <Menu theme='dark' mode='horizontal' defaultSelectedKeys={['/']} selectedKeys={[location.pathname]}>
      {user &&
        <Menu.Item key='/'>
          <NavLink to={config.PATH_ROOT}>
            <HomeOutlined/>
            <span>{t('Home page')}</span>
          </NavLink>
        </Menu.Item>
      }
      {user &&
        <Menu.Item key='/chat'>
          <NavLink to={config.PATH_ROOT + '/chat'}>
            <AlignCenterOutlined/>
            <span>{t('Chat')}</span>
          </NavLink>
        </Menu.Item>
      }
      <Menu.Item key="spacer" style={rightAlignedMenuItem}></Menu.Item>
      {user &&
        <Menu.SubMenu key="AdminSubMenu" title={t('Admin')} icon={<SettingOutlined/>}>
          <Menu.Item key='/admin/teams'>
            <NavLink to={config.PATH_ROOT + '/admin/teams'}>
              <TeamOutlined/>
              <span>{t('Teams')}</span>
            </NavLink>
          </Menu.Item>
          <Menu.Item key='/admin/users'>
            <NavLink to={config.PATH_ROOT + '/admin/users'}>
              <UserOutlined/>
              <span>{t('Users')}</span>
            </NavLink>
          </Menu.Item>
        </Menu.SubMenu>
      }
      {user &&
        <Menu.Item key="notifications">
          <Popover placement="bottom" title={t('Notifications')} content="" trigger="click">
            <BulbOutlined/>
          </Popover>
        </Menu.Item>
      }
      <Menu.SubMenu key="LangSubMenu" title={language}>
        <Menu.Item key="us" onClick={onLangClick}>
          English
        </Menu.Item>
        <Menu.Item key="lv" onClick={onLangClick}>
          Latviešu
        </Menu.Item>
      </Menu.SubMenu>
      {!user &&
        <Menu.Item key='/login'>
          <NavLink to={config.PATH_ROOT + '/login'}>
            <LoginOutlined/>
            <span>{t('Login')}</span>
          </NavLink>
        </Menu.Item>
      }
      {user &&
        <Menu.Item
          key='logout'
          onClick={() => signout(() => navigate('/', {replace: true}))}
        >
          <LogoutOutlined/>
          <span>{t('Logout')}</span>
        </Menu.Item>
      }
    </Menu>
  )
}


export {MainMenu};
