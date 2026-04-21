import {useTranslation} from "react-i18next";
import {Typography} from "antd";

const {Title} = Typography;

const HomePage = () => {
  const {t} = useTranslation();

  return (
    <div>
      <Title level={2}>{t('Home page')}</Title>
    </div>
  )
}

export {HomePage};
