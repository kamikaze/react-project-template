import React from 'react';
import {Button, Input, Space} from 'antd';
import {SearchOutlined} from '@ant-design/icons';
import {useTranslation} from 'react-i18next';

interface IColumnSearchProps {
  setSelectedKeys: any,
  selectedKeys: string[],
  confirm: any,
  clearFilters: any,
}

export default function ColumnSearchProps(dataIndex: string, searchState: any, setSearchState: any) {
  // const [searchInput, setSearchInput] = useState<Input | null>(null);
  const {t} = useTranslation();

  function handleSearch(selectedKeys: string[], confirm: any, dataIndex: string) {
    (searchState as any)[dataIndex] = selectedKeys[0];
    setSearchState({...searchState});
    confirm({closeDropdown: true});
  }

  function handleReset(clearFilters: any, dataIndex: string) {
    delete (searchState as any)[dataIndex];
    setSearchState({...searchState});

    clearFilters();

/*    if (searchInput) {
      searchInput.setValue('');
    }*/
  }

  return {
    filterDropdown: ({setSelectedKeys, selectedKeys, confirm, clearFilters}: IColumnSearchProps) => {
      return (
        <div style={{padding: 8}}>
          <Input
/*            ref={node => setSearchInput(node)}*/
            onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
            style={{width: 188, marginBottom: 8, display: 'block'}}
          />
          <Space>
            <Button
              type='primary' icon={<SearchOutlined/>} size='small' style={{width: 90}}
              onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            >{t('Search')}</Button>
            <Button onClick={() => handleReset(clearFilters, dataIndex)} size='small' style={{width: 90}}>
              {t('Reset')}
            </Button>
          </Space>
        </div>
      );
    },
    filterIcon: (filtered: boolean) => {
      return (
        <SearchOutlined style={{color: searchState[dataIndex] ? '#1890ff' : undefined}}/>
      );
    },
    onFilterDropdownVisibleChange: (visible: boolean) => {
/*      if (searchInput && visible) {
        setTimeout(() => searchInput.select(), 100);
      }*/
    }
  };
}
