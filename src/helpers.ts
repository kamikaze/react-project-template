function prepareQuery(searchParams: any) {
  const query: any = {
    page: searchParams.get('page') || 1,
    size: searchParams.get('size') || 20
  };

  const orderBy = searchParams.get('order_by')

  if (orderBy) {
    query['order_by'] = orderBy;
  }

  return query;
}

export {prepareQuery};
