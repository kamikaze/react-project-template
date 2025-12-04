import {useEffect, useState} from "react";
import config from "../config.ts";
import {useAuth} from "../hook/useAuth";

type UserProfileData = {
  email?: string;
};

const UserProfilePage = () => {
  const { getAccessToken } = useAuth();
  const [profileData, setProfileData] = useState<UserProfileData>();

  useEffect(() => {
    (async () => {
      try {
        const token = await getAccessToken();
        const response = await fetch(`${config.API_BASE_URL}/users/me`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        setProfileData(await response.json());
      } catch (e) {
        console.error(e);
      }
    })();
  }, [getAccessToken]);

  if (!profileData) {
    return <div>Loading...</div>;
  }

  return (
    <ul>
      <li>{profileData.email}</li>
    </ul>
  );
}

export {UserProfilePage};
