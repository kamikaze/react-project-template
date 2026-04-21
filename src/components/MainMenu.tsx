import {Menu, Popover} from "antd";
import {NavLink, useLocation, useNavigate} from "react-router-dom";
import config from "../config";
import {
  ApartmentOutlined,
  AreaChartOutlined,
  BulbOutlined,
  ClusterOutlined,
  CreditCardOutlined,
  DesktopOutlined,
  ExportOutlined,
  FileDoneOutlined,
  FileExcelOutlined,
  HomeOutlined,
  ImportOutlined,
  LoginOutlined,
  LogoutOutlined,
  MoneyCollectOutlined,
  PercentageOutlined,
  PrinterOutlined,
  RetweetOutlined,
  SettingOutlined,
  TeamOutlined,
  ToolOutlined,
  UnorderedListOutlined,
  UserOutlined
} from "@ant-design/icons";
import React, {useState} from "react";
import {useAuth} from "../hook/useAuth";
import {useTranslation} from "react-i18next";

const MainMenu = () => {
  const {user, signout, roles} = useAuth();
  const isAdmin = roles.includes('admin');
  const isAnalytic = roles.includes('analytic');
  const isCashier = roles.includes('cashier');

  if (user) {
    console.log('--- Menu Debug Info ---');
    console.log('User:', user);
    console.log('Roles from useAuth:', roles);
    console.log('isAdmin:', isAdmin);
    console.log('isAnalytic:', isAnalytic);
    console.log('isCashier:', isCashier);
    console.log('-----------------------');
  }

  const navigate = useNavigate();
  const location = useLocation();
  const [language, setLanguage] = useState<string>('LV');
  const {t, i18n} = useTranslation();
  const rightAlignedMenuItem = {marginLeft: 'auto'};

  const onLangClick = (info: any) => {
    setLanguage(info.key.toUpperCase());
    i18n.changeLanguage(info.key).then(r => {
    });
  }

  return (
    <Menu theme='dark' mode='horizontal' defaultSelectedKeys={['/']} selectedKeys={[location.pathname]}>
      <Menu.Item key='/'>
        <NavLink to={config.PATH_ROOT + '/'}>
          <HomeOutlined/>
          <span>{t('Main')}</span>
        </NavLink>
      </Menu.Item>
      <Menu.Item key="spacer" style={rightAlignedMenuItem}></Menu.Item>
      {user && isAdmin &&
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
      {user && isAdmin &&
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
      {user &&
        <Menu.Item
          key='logout'
          onClick={() => signout()}
        >
          <LogoutOutlined/>
          <span>{t('Logout')}</span>
        </Menu.Item>
      }
    </Menu>
  )
}


export {MainMenu};
