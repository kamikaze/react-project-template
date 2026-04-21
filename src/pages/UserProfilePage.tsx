import { useAuth } from "../hook/useAuth";

const UserProfilePage = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <div>Not authenticated</div>;
  }

  return (
    <ul>
      <li>{user}</li>
    </ul>
  );
};

export { UserProfilePage };
