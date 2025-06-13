import React, {Suspense} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {ConfigProvider, Spin} from "antd";
import lvLV from "antd/lib/locale/lv_LV";

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={<Spin/>}>
      <ConfigProvider locale={lvLV}>
        <App/>
      </ConfigProvider>
    </Suspense>
  </React.StrictMode>
)
