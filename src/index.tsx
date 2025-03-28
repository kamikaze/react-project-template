import React, {Suspense} from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import {ConfigProvider, Spin} from "antd";
import enUS from 'antd/lib/locale/en_US';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Suspense fallback={<Spin/>}>
      <ConfigProvider locale={enUS}>
        <App/>
      </ConfigProvider>
    </Suspense>
  </React.StrictMode>
);
