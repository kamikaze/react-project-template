import {useTranslation} from "react-i18next";
import {createSearchParams, useLoaderData, useNavigate, useSearchParams} from "react-router-dom";
import {PlusOutlined} from "@ant-design/icons";
import {Button, Space, Table} from "antd";
import React, {useCallback, useEffect, useState} from "react";
import type {ColumnsType} from "antd/lib/table";
import Title from "antd/lib/typography/Title";
import moment from "moment";
import "moment-timezone";
import {User} from "oidc-client-ts";
import {prepareQuery} from "../helpers.ts";
import type {APIPageResponse, UserProfile} from "../interfaces.ts";
import useHttp from "../hook/http.ts";
import {BackendService} from "../services.ts";
import {useAuth} from "../hook/useAuth.tsx";
import config from "../config.ts";

const DEFAULT_SEARCH_PARAMS = {order_by: '-created_at'};

const UserListPage = () => {
  const navigate = useNavigate();
  const loaderResponse: APIPageResponse<UserProfile> = useLoaderData() as APIPageResponse<UserProfile>;
  const {loading, request, error, clearError} = useHttp();
  const [dataSource, setDataSource] = useState<UserProfile[]>();
  const [rowCount, setRowCount] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchParams, setSearchParams] = useSearchParams(DEFAULT_SEARCH_PARAMS);
  const {t} = useTranslation();

  const columns: ColumnsType<UserProfile> = [
    {
      title: 'ID',
      dataIndex: 'uid',
      key: 'uid',
      sorter: true,
      // ...ColumnSearchProps('id', searchState, setSearchState)
    },
    {
      title: t('Username'),
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      defaultSortOrder: 'ascend' as const,
      // ...ColumnSearchProps('name', searchState, setSearchState)
    },
    {
      title: t('Email'),
      dataIndex: 'email',
      key: 'email',
      sorter: true,
      defaultSortOrder: 'ascend' as const,
      // ...ColumnSearchProps('name', searchState, setSearchState)
    },
    {
      title: 'created_at',
      dataIndex: 'created_at',
      sorter: true,
      defaultSortOrder: 'descend' as const,
      render: (_, {created_at}) => (
        created_at && <>{moment.tz(created_at, moment.tz.guess()).format('YYYY-MM-DD HH:mm')}</>
      ),
    },
    {
      title: 'updated_at',
      dataIndex: 'updated_at',
      sorter: true,
      defaultSortOrder: 'descend' as const,
      render: (_, {updated_at}) => (
        updated_at && <>{moment.tz(updated_at, moment.tz.guess()).format('YYYY-MM-DD HH:mm')}</>
      ),
    },
  ];

  const fetchUserProfiles = useCallback(async () => {
    const query = prepareQuery(searchParams);

    try {
      // We don't strictly need to pass the token here because the fetch patch
      // in AuthProvider will automatically add it for all requests to API_BASE_URL.
      const result = await BackendService.getUsers(query);

      setDataSource(result.items);
      setCurrentPage(result.page);
      setRowCount(result.total);
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        navigate('/login', {replace: true});
        return;
      }
      console.error('Failed to fetch vouchers:', err);
    }
  }, [searchParams]);

  const onTableChange = useCallback(async (pagination: any, filters: any, sorter: any, extra: any) => {
    let params: any = {
      page: pagination.current,
      size: pagination.pageSize,
    }

    if (sorter.column !== undefined) {
      params['order_by'] = (sorter.order === 'descend' ? '-' : '') + sorter.field
    }
    setSearchParams(params);
  }, [setSearchParams]);

  useEffect(() => {
    setDataSource(loaderResponse.items);
    setCurrentPage(loaderResponse.page);
    setRowCount(loaderResponse.total);

    // Set up interval to fetch data every 10 seconds
    const interval = setInterval(fetchUserProfiles, 10000);

    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, [loaderResponse, fetchUserProfiles]);

  return (
    <div>
      <Title level={2}>{t('Users')}</Title>
      <Space size='middle' orientation='vertical' style={{width: '100%'}}>
        <Button>
          <PlusOutlined/>{t('Create')}
        </Button>
        <Table columns={columns} dataSource={dataSource} onChange={onTableChange}
               loading={loading}
               showSorterTooltip={false}
               pagination={{defaultPageSize: 20, position: ['bottomRight'], total: rowCount, current: currentPage}}
               sortDirections={['descend', 'ascend']}
        />
      </Space>
    </div>
  )
}

const userResultLoader = async ({request}: any) => {
  let searchParams = new URL(request.url).searchParams;

  if (!searchParams.size) {
    searchParams = createSearchParams(DEFAULT_SEARCH_PARAMS);
  }

  const query: Record<string, string> = prepareQuery(searchParams);

  // Load token from storage (standard oidc-client-ts behavior)
  const oidcStorage = window.sessionStorage.getItem(`oidc.user:${config.API_BASE_URL}/config:${config.API_BASE_URL}/config`); // This might be tricky to guess exactly
  // Actually, better to check how it's stored in AuthProvider.
  // In AuthProvider.tsx: userStore: new WebStorageStateStore({ store: window.sessionStorage })
  // The key is usually `oidc.user:<authority>:<client_id>`

  // Let's try to find the key in sessionStorage
  let token: string | null = null;
  for (let i = 0; i < window.sessionStorage.length; i++) {
    const key = window.sessionStorage.key(i);
    if (key?.startsWith('oidc.user:')) {
      const storedUser = window.sessionStorage.getItem(key);
      if (storedUser) {
        const user = User.fromStorageString(storedUser);
        token = user.access_token;
        break;
      }
    }
  }

  return BackendService.getUsers(query, token);
}

export {UserListPage, userResultLoader};
