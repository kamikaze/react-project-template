import {t} from "i18next";
import {PlusOutlined} from "@ant-design/icons";
import type {TableProps} from "antd";
import {Button, Table, Typography} from "antd";
import {useEffect, useRef, useState} from "react";

type ColumnsType<T> = TableProps<T>["columns"];
const {Title} = Typography;

const TeamListPage = () => {
  const [dataSource, setDataSource] = useState([]);
  const [rowCount, setRowCount] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchState, setSearchState] = useState({});
  const [loading, setLoading] = useState<boolean>(false);
  const [scrollY, setScrollY] = useState<number>();
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  interface DataType {
    key: React.Key;
    name: string;
  }

  const columns: ColumnsType<DataType> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      sorter: true,
      // ...ColumnSearchProps('id', searchState, setSearchState)
    },
    {
      title: t('Name'),
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      defaultSortOrder: 'ascend' as const,
      // ...ColumnSearchProps('name', searchState, setSearchState)
    },
  ];

  const onTableChange = () => {

  };

  useEffect(() => {
    const calculateScrollHeight = () => {
      if (containerRef.current && headerRef.current) {
        const containerHeight = containerRef.current.clientHeight;
        const headerHeight = headerRef.current.offsetHeight;
        // Account for header, margins, pagination bar (64px), and buffer
        const availableHeight = containerHeight - headerHeight - 100;
        setScrollY(availableHeight > 200 ? availableHeight : 200);
      }
    };

    calculateScrollHeight();
    window.addEventListener('resize', calculateScrollHeight);

    return () => window.removeEventListener('resize', calculateScrollHeight);
  }, []);

  return (
    <div ref={containerRef} style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
      <div ref={headerRef}>
        <Title level={2} style={{marginBottom: 16}}>{t('Teams')}</Title>
        <Button style={{marginBottom: 16}}>
          <PlusOutlined/>{t('Create')}
        </Button>
      </div>
      <div style={{flex: 1, minHeight: 0}}>
        <Table dataSource={dataSource} columns={columns} loading={loading} onChange={onTableChange}
               showSorterTooltip={false}
               scroll={{x: 'max-content', y: scrollY}}
               pagination={{ defaultPageSize: 20, position: ['bottomRight'], total: rowCount, current: currentPage }}
               sortDirections={['descend', 'ascend']}
        />
      </div>
    </div>
  )
}

export {TeamListPage};
