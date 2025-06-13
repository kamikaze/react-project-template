import {useTranslation} from "react-i18next";
import Title from "antd/lib/typography/Title";


const HomePage = () => {
  const {t} = useTranslation();

  return (
    <div>
      <Title level={2}>{t('Home page')}</Title>
    </div>
  )
}

export {HomePage};
