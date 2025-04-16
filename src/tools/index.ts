import { listAccounts } from "./listAccounts";
import { listContainers } from "./listContainers";
import { getContainer } from "./getContainer";
import { createContainer } from "./createContainer";
import { deleteContainer } from "./deleteContainer";
import { listWorkspaces } from "./listWorkspaces";
import { getContainerSnippet } from "./getContainerSnippet";

export const tools = [
  listAccounts,
  listContainers,
  getContainer,
  createContainer,
  deleteContainer,
  listWorkspaces,
  getContainerSnippet,
];
