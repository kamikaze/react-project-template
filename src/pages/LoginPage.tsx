import {useLocation, useNavigate} from "react-router-dom";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromPage = location.state?.from?.pathname || '/';

  return (
    <div>Login Page, {fromPage}</div>
  )
}

export {LoginPage};
