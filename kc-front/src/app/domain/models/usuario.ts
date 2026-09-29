export interface Usuario {
  username: string;
  roles: {
    realm: string[];
    chatApi: string[];
  };
}
