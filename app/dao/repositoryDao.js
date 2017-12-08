import Api from '../net'
import Address from '../net/address'
import GitHubTrending from '../utils/trending/GitHubTrending'
import realm from './db'
import {generateHtml} from "../utils/htmlUtils";

const getTrendDao = async (page = 0, since, languageType) => {
    let localLanguage = (languageType) ? languageType : "*";
    let nextStep = async () => {
        let url = Address.trending(since, languageType);
        let res = await new GitHubTrending().fetchTrending(url);
        if (res && res.result && res.data.length > 0 && page <= 1) {
            realm.write(() => {
                let allData = realm.objects('TrendRepository').filtered(`since="${since}" AND languageType="${localLanguage}"`);
                realm.delete(allData);
                res.data.forEach((item) => {
                    realm.create('TrendRepository', {
                        since: since,
                        languageType: localLanguage,
                        data: JSON.stringify(item)
                    });
                })
            });
        }
        return {
            data: res.data,
            result: res.result
        };
    };
    let allData = realm.objects('TrendRepository').filtered(`since="${since}" AND languageType="${localLanguage}"`);
    if (allData) {
        let data = [];
        allData.forEach((item) => {
            data.push(JSON.parse(item.data));
        });
        return {
            data: data,
            next: nextStep,
            result: true
        };
    } else {
        return {
            data: [],
            next: nextStep,
            result: false
        };
    }

};

const searchRepositoryDao = async (q, sort, order, type, page, pageSize) => {
    let url = Address.sreach(q, sort, order, type, page, pageSize);
    let res = await await Api.netFetch(url);
    return {
        data: res.data ? res.data.items : res.data,
        result: res.result
    };
};

const searchRepositoryIssueDao = async (q, page) => {
    let url = Address.repositoryIssueSearch(q) + Address.getPageParams("&", page);
    let res = await await Api.netFetch(url);
    return {
        data: res.data ? res.data.items : res.data,
        result: res.result
    };
};

const getUserRepositoryDao = async (userName, page, sort) => {
    let url = Address.userRepos(userName, sort) + Address.getPageParams("&", page);
    let res = await await Api.netFetch(url);
    return {
        data: res.data,
        result: res.result
    };
};

const getStarRepositoryDao = async (userName, page, sort) => {
    let url = Address.userStar(userName, sort) + Address.getPageParams("&", page);
    let res = await await Api.netFetch(url);
    return {
        data: res.data,
        result: res.result
    };
};

const getRepositoryDetailDao = (userName, reposName) => {
    let fullName = userName + "/" + reposName;
    let nextStep = async () => {
        let url = Address.getReposDetail(userName, reposName);
        let res = await await Api.netFetch(url);
        if (res && res.result && res.data) {
            realm.write(() => {
                let data = realm.objects('RepositoryDetail').filtered(`fullName="${fullName}" AND branch="master"`);
                realm.delete(data);
                realm.create('RepositoryDetail', {
                    branch: "master",
                    fullName: fullName,
                    data: JSON.stringify(res.data)
                });
            });
        }
        return {
            data: res.data,
            result: res.result
        };
    };

    let AllData = realm.objects('RepositoryDetail').filtered(`fullName="${fullName}" AND branch="master"`);
    if (AllData && AllData.length > 0) {
        return {
            data: JSON.parse(AllData[0].data),
            result: true,
            next: nextStep
        };
    } else {
        return {
            data: {},
            result: false,
            next: nextStep
        };
    }

};


const getRepositoryDetailReadmeHtmlDao = (userName, reposName, branch) => {
    let fullName = userName + "/" + reposName;
    let curBranch = (branch) ? branch : "master";
    let nextStep = async () => {
        let url = Address.readmeFile(userName + '/' + reposName, branch);
        let res = await await Api.netFetch(url, 'GET', null, false, {Accept: 'application/vnd.github.html'});
        if (res && res.result && res.data.length > 0) {
            let curData = generateHtml(res.data);
            realm.write(() => {
                let data = realm.objects('RepositoryDetailReadme').filtered(`fullName="${fullName}" AND branch="${curBranch}"`);
                realm.delete(data);
                realm.create('RepositoryDetailReadme', {
                    branch: "master",
                    fullName: fullName,
                    data: curData,
                });
            });
            return {
                data: curData,
                result: true
            };
        } else {
            return {
                data: "",
                result: false
            };
        }
    };
    let AllData = realm.objects('RepositoryDetailReadme').filtered(`fullName="${fullName}" AND branch="${curBranch}"`);
    if (AllData && AllData.length > 0) {
        return {
            data: AllData[0].data,
            result: true,
            next: nextStep
        };
    } else {
        return {
            data: {},
            result: false,
            next: nextStep
        };
    }
};


const createForkDao = async (userName, reposName) => {
    let url = Address.createFork(userName, reposName);
    let res = await await Api.netFetch(url, 'POST');
    return {
        data: res.data,
        result: res.result
    };
};

const getBranchesDao = async (userName, reposName) => {
    let url = Address.getbranches(userName, reposName);
    let res = await await Api.netFetch(url);
    return {
        data: res.data,
        result: res.result
    };
};

const getRepositoryForksDao = async (userName, reposName, page) => {
    let url = Address.getReposForks(userName, reposName) + Address.getPageParams("?", page);
    let res = await await Api.netFetch(url);
    return {
        data: res.data,
        result: res.result
    };
};

const getRepositoryStarDao = async (userName, reposName, page) => {
    let url = Address.getReposStar(userName, reposName) + Address.getPageParams("?", page);
    let res = await await Api.netFetch(url);
    return {
        data: res.data,
        result: res.result
    };
};

const getRepositoryWatcherDao = async (userName, reposName, page) => {
    let url = Address.getReposWatcher(userName, reposName) + Address.getPageParams("?", page);
    let res = await await Api.netFetch(url);
    return {
        data: res.data,
        result: res.result
    };
};

const getRepositoryStatusDao = async (userName, reposName) => {
    let urls = Address.resolveStarRepos(userName, reposName);
    let urlw = Address.resolveWatcherRepos(userName, reposName);
    let ress = await await Api.netFetch(urls);
    let resw = await await Api.netFetch(urlw);
    return {
        data: {star: ress.result, watch: resw.result},
        result: true
    };
};

const doRepositoryStarDao = async (userName, reposName, star) => {
    let url = Address.resolveStarRepos(userName, reposName);
    let res = await await Api.netFetch(url, star ? 'PUT' : 'DELETE');
    return {
        data: res.result,
        result: res.result
    };
};

const doRepositoryWatchDao = async (userName, reposName, watch) => {
    let url = Address.resolveWatcherRepos(userName, reposName);
    let res = await await Api.netFetch(url, watch ? 'PUT' : 'DELETE');
    return {
        data: res.result,
        result: res.result
    };
};

const getRepositoryReleaseDao = async (userName, reposName) => {
    let url = Address.getReposRelease(userName, reposName);
    let res = await await Api.netFetch(url, 'GET', null, false, {Accept: 'application/vnd.github.html,application/vnd.github.VERSION.raw'});
    return {
        data: res.data,
        result: res.result
    };
};

const getRepositoryTagDao = async (userName, reposName) => {
    let url = Address.getReposTag(userName, reposName);
    let res = await await Api.netFetch(url, 'GET', null, false, {Accept: 'application/vnd.github.html,application/vnd.github.VERSION.raw'});
    return {
        data: res.data,
        result: res.result
    };
};


const getReposCommitsDao = async (userName, reposName, page) => {
    let url = Address.getReposCommits(userName, reposName) + Address.getPageParams("?", page);
    let res = await await Api.netFetch(url);
    return {
        data: res.data,
        result: res.result
    };
};

const getReposCommitsInfoDao = async (userName, reposName, sha) => {
    let url = Address.getReposCommitsInfo(userName, reposName, sha);
    let res = await await Api.netFetch(url);
    return {
        data: res.data,
        result: res.result
    };
};

const getReposFileDirDao = async (userName, reposName, path = '', branch) => {
    let url = Address.reposDataDir(userName, reposName, path, branch);
    let res = await await Api.netFetch(url, 'GET', null, false, {Accept: 'application/vnd.github.html'});
    return {
        data: res.data,
        result: res.result
    };
};

const getRepositoryDetailReadmeDao = async (userName, reposName, branch) => {
    let url = Address.readmeFile(userName + '/' + reposName, branch);
    let res = await await Api.netFetch(url);
    return {
        data: res.data,
        result: res.result
    };
};

export default {
    getTrendDao,
    searchRepositoryDao,
    getUserRepositoryDao,
    getStarRepositoryDao,
    getRepositoryDetailDao,
    getRepositoryDetailReadmeDao,
    getRepositoryDetailReadmeHtmlDao,
    getRepositoryForksDao,
    getRepositoryStarDao,
    getRepositoryWatcherDao,
    getRepositoryStatusDao,
    doRepositoryStarDao,
    doRepositoryWatchDao,
    getRepositoryReleaseDao,
    getReposCommitsDao,
    getReposCommitsInfoDao,
    getRepositoryTagDao,
    getReposFileDirDao,
    searchRepositoryIssueDao,
    createForkDao,
    getBranchesDao
}