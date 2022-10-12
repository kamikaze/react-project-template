import {useLocation, Navigate} from 'react-router-dom';

interface Props {
  children: JSX.Element
}

const RequireAuth = ({children}: Props) => {
  const location = useLocation();
  const auth = false;

  if (!auth) {
    return <Navigate to={'/login'} state={{from: location}} />
  }

  return children;
}

export {RequireAuth};
