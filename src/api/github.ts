/**
 * GitHub GraphQL APIと通信するモジュール
 */
const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

export interface PullRequestNode {
  mergedAt: string;
  commits: {
    nodes: {
      commit: {
        committedDate: string;
      }
    }[];
  };
}

export interface IssueNode {
  createdAt: string;
  closedAt: string | null;
}

/**
 * GraphQLクエリを実行する共通関数
 * @param query 実行するクエリ
 * @param variables クエリの変数
 * @param token GitHub Personal Access Token
 * @returns 取得したデータ
 */
export async function fetchWithGraphQL(query: string, variables: any, token: string) {
  const response = await fetch(GITHUB_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Authorization': `bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store'
  });
  
  if (!response.ok) {
    throw new Error(`GitHub API リクエスト失敗: ${response.statusText}`);
  }
  
  const json = await response.json();
  if (json.errors) {
    throw new Error(`GraphQL エラー: ${json.errors.map((e: any) => e.message).join(', ')}`);
  }
  
  return json.data;
}

/**
 * 指定期間内のマージ済みPull Requestを取得する
 * @param owner リポジトリのオーナー
 * @param repo リポジトリ名
 * @param fromDate 開始日 (YYYY-MM-DD)
 * @param toDate 終了日 (YYYY-MM-DD)
 * @param token GitHub Personal Access Token
 * @returns PullRequestNodeの配列
 */
export async function fetchMergedPullRequests(owner: string, repo: string, fromDate: string, toDate: string, token: string, targetBranch: string = 'main'): Promise<PullRequestNode[]> {
  const searchQuery = `repo:${owner}/${repo} is:pr is:merged base:${targetBranch} merged:${fromDate}..${toDate}`;
  const query = `
    query($searchQuery: String!, $cursor: String) {
      search(query: $searchQuery, type: ISSUE, first: 50, after: $cursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          ... on PullRequest {
            mergedAt
            commits(first: 1) {
              nodes {
                commit {
                  committedDate
                }
              }
            }
          }
        }
      }
    }
  `;
  
  let allNodes: PullRequestNode[] = [];
  let hasNextPage = true;
  let cursor = null;
  
  while (hasNextPage) {
    const data = await fetchWithGraphQL(query, { searchQuery, cursor }, token);
    const search = data.search;
    allNodes = allNodes.concat(search.nodes as PullRequestNode[]);
    hasNextPage = search.pageInfo.hasNextPage;
    cursor = search.pageInfo.endCursor;
  }
  
  return allNodes;
}

/**
 * 指定期間内のバグ・インシデントIssueを取得する
 * @param owner リポジトリのオーナー
 * @param repo リポジトリ名
 * @param fromDate 開始日 (YYYY-MM-DD)
 * @param toDate 終了日 (YYYY-MM-DD)
 * @param token GitHub Personal Access Token
 * @returns IssueNodeの配列
 */
export async function fetchBugIssues(owner: string, repo: string, fromDate: string, toDate: string, token: string, bugLabels: string = 'bug,incident'): Promise<IssueNode[]> {
  const searchQuery = `repo:${owner}/${repo} is:issue label:${bugLabels} created:${fromDate}..${toDate}`;
  const query = `
    query($searchQuery: String!, $cursor: String) {
      search(query: $searchQuery, type: ISSUE, first: 50, after: $cursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          ... on Issue {
            createdAt
            closedAt
          }
        }
      }
    }
  `;
  
  let allNodes: IssueNode[] = [];
  let hasNextPage = true;
  let cursor = null;
  
  while (hasNextPage) {
    const data = await fetchWithGraphQL(query, { searchQuery, cursor }, token);
    const search = data.search;
    allNodes = allNodes.concat(search.nodes as IssueNode[]);
    hasNextPage = search.pageInfo.hasNextPage;
    cursor = search.pageInfo.endCursor;
  }
  
  return allNodes;
}

/**
 * サジェスト用のリポジトリ一覧を取得する
 * @param queryStr 検索文字列（空の場合は最近更新したリポジトリ）
 * @param token GitHub Personal Access Token
 * @returns リポジトリ名(owner/repo)の配列
 */
export async function searchRepositories(queryStr: string, token: string): Promise<string[]> {
  // ユーザーが所属・アクセス権を持つリポジトリ、および所属する組織のリポジトリを最新順に取得
  const q = `
    query {
      viewer {
        repositories(first: 100, affiliations: [OWNER, ORGANIZATION_MEMBER, COLLABORATOR], orderBy: {field: PUSHED_AT, direction: DESC}) {
          nodes {
            nameWithOwner
          }
        }
        organizations(first: 10) {
          nodes {
            repositories(first: 50, orderBy: {field: PUSHED_AT, direction: DESC}) {
              nodes {
                nameWithOwner
              }
            }
          }
        }
      }
    }
  `;
  const data = await fetchWithGraphQL(q, {}, token);
  const repoSet = new Set<string>();

  if (data.viewer.repositories?.nodes) {
    data.viewer.repositories.nodes.forEach((n: any) => {
      if (n?.nameWithOwner) repoSet.add(n.nameWithOwner);
    });
  }

  if (data.viewer.organizations?.nodes) {
    data.viewer.organizations.nodes.forEach((org: any) => {
      if (org.repositories?.nodes) {
        org.repositories.nodes.forEach((n: any) => {
          if (n?.nameWithOwner) repoSet.add(n.nameWithOwner);
        });
      }
    });
  }

  const allRepos = Array.from(repoSet);

  const lowerQuery = queryStr.toLowerCase().trim();
  if (!lowerQuery) {
    return allRepos.slice(0, 15);
  }

  // 取得したリポジトリの中から、入力された文字列に一致するものをローカルで絞り込む
  return allRepos.filter(repo => repo.toLowerCase().includes(lowerQuery)).slice(0, 15);
}
