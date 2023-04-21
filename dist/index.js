"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findALLCSPROJmodules = exports.getDotnetSources = exports.runRepoInfo = void 0;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const packageJson = require('../package.json');
const child_process_1 = require("child_process");
const child_process = __importStar(require("child_process"));
// ======================geht nicht wie gewünscht==================================
// ==================================================================================================
const updateStrategy = core.getInput('updateStrategy', { required: false }) || 'MINOR';
const sources = core.getMultilineInput('sources', { required: false }).flatMap(s => s.split(/\r?\n/)).map(s => s.trim());
const npmSources = core.getMultilineInput('npmSources', { required: false }).flatMap(s => s.split(/\r?\n/)).map(s => s.trim());
const submoduleURLs = core.getMultilineInput('submoduleURLs', { required: false }).flatMap(s => s.split(/\r?\n/)).map(s => s.trim());
// // ===========================works ===========================================
//=========================================
const child_process_2 = require("child_process");
function getNPackageInfo(packageName) {
    try {
        // Get package information using `npm ls` and parse JSON output
        const packageData = JSON.parse((0, child_process_2.execSync)(`npm ls ${packageName} --depth=0 --json`).toString());
        // Extract package information from parsed JSON
        const packageInfo = {
            project: packageData.name,
            source: packageData.dependencies[packageName].resolved,
            name: packageName,
            currentVersion: packageData.dependencies[packageName].version,
        };
        return packageInfo;
    }
    catch (error) {
        console.error(`Error getting information for package ${packageName}: ${error}`);
        return null;
    }
}
function getAllPackageInfo() {
    try {
        // Get package information using `npm ls` and parse JSON output
        const packageData = JSON.parse((0, child_process_2.execSync)(`npm ls --depth=0 --json`).toString());
        // Extract package names from parsed JSON
        const packageNames = Object.keys(packageData.dependencies);
        // Get package information for each package name 
        const packageInfoList = packageNames.map((packageName) => getNPackageInfo(packageName));
        const internPackages = [];
        const externPackages = [];
        packageInfoList.forEach((packageInfo) => {
            if (packageInfo != null) {
                const isInternal = npmSources.some(npmSource => packageInfo.source.includes(npmSource));
                if (isInternal) {
                    internPackages.push(packageInfo);
                }
                else {
                    externPackages.push(packageInfo);
                }
            }
        });
        return { intern: internPackages, extern: externPackages };
    }
    catch (error) {
        console.error(`Error getting information for all packages: ${error}`);
        return { intern: [], extern: [] };
    }
}
//==============================
//===========================  
// ========================================
function listNpmRegistries() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            (0, child_process_1.exec)('npm config get registry', (err, stdout, stderr) => {
                if (err) {
                    reject(err);
                }
                else {
                    const registries = stdout.split('\n').filter(registry => registry.trim() !== '');
                    resolve(registries);
                }
            });
        });
    });
}
// ======================================================
function runRepoInfo() {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const token = core.getInput('github-token');
        const octokit = github.getOctokit(token);
        const context = github.context;
        const repo = ((_a = context.payload.repository) === null || _a === void 0 ? void 0 : _a.full_name) || '';
        const branch = core.getInput('branch-name');
        const { data: commit } = yield octokit.rest.repos.getCommit({
            owner: context.repo.owner,
            repo: context.repo.repo,
            ref: branch,
        });
        const output = {
            repository: {
                orgName: context.repo.owner,
                repoName: repo,
                currentReleaseTag: '',
                license: '',
                sha: commit.sha,
            },
            InternNpmPackages: [],
            ExternNpmPackages: [],
            // OutdatedNugetPackages: [],
            InternNugetPackages: [],
            ExternNugetPackages: [],
            InternSubmodules: [],
            ExternSubmodules: [],
            updateStrategy: updateStrategy,
            //   NugetDependencies: [],
            //   NpmDependencies: []
        };
        // Get repository info
        const { data: repository } = yield octokit.rest.repos.get({
            owner: context.repo.owner,
            repo: context.repo.repo,
        });
        const dotNetProjects = yield findALLCSPROJmodules();
        const ListOfSources = yield getDotnetSources();
        output.repository.currentReleaseTag = repository.default_branch;
        output.repository.license = ((_b = repository.license) === null || _b === void 0 ? void 0 : _b.name) || '';
        // const packageInfoList = getAllPackageInfo();
        // console.log(`New bla bla package info list: ${JSON.stringify(packageInfoList, null, 2)}`)
        output.InternNpmPackages = yield getAllPackageInfo().intern;
        output.ExternNpmPackages = yield getAllPackageInfo().extern;
        // output.OutdatedNugetPackages = await getOutdatedPackages(dotNetProjects, ListOfSources);
        output.InternNugetPackages = yield (yield getAllNuGetPackages(dotNetProjects, ListOfSources)).intern;
        output.ExternNugetPackages = yield (yield getAllNuGetPackages(dotNetProjects, ListOfSources)).extern;
        output.InternSubmodules = yield (yield getSubmodules()).intern;
        output.ExternSubmodules = yield (yield getSubmodules()).extern;
        output.updateStrategy = updateStrategy;
        // output.NugetDependencies = await getDependentProjects(output.InternNugetPackages);
        // output.NpmDependencies = await getNpmDependentProjects(output.InternnpmPackages);
        try {
            core.info(JSON.stringify(output, null, 2));
            const ouputstring = JSON.stringify(output, null, 2);
        }
        catch (error) {
            core.setFailed("WriteFileSync ist falsch");
        }
    });
}
exports.runRepoInfo = runRepoInfo;
runRepoInfo();
//======================================================
// // Replace with the URL of the repository you want to clone
// const repositoryUrl = "https://github.com/AdrianRallBhs/W2I2.git";
// // Replace with the name of the branch you want to push to
// const featureBranchName = "feature-test";
// const repositoryDir = "W2I2";
// const email = "adrian@asda4.de"
// const name = "Adrian Rall"
// try {
//   // Clone the repository
//   execSync(`git clone ${repositoryUrl}`);
//   process.chdir(repositoryDir);
//   execSync(`git checkout ${featureBranchName}`, { shell: "/bin/bash" });
//   execSync(`git config --global user.email ${email}`);
//   execSync(`git config --global user.name \"${name}\"`);
//   //   // Run the function and write the output to a file
//   const output = runRepoInfo().toString()
//   fs.writeFileSync("output.json", JSON.stringify(output, null, 2));
//   //   // Ensure that the remote repository is set up correctly
//   // execSync(`git remote set-url origin ${repositoryUrl}`);
//   //   // Commit and push the changes to the feature branch
//   execSync(`git add .`);
//   execSync(`git commit -m "Add output to output.json"`);
//   execSync(`git push origin ${featureBranchName}`);
// } catch (error) {
//   console.error(error);
// }
//=====================================================
function getDotnetSources() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            (0, child_process_1.exec)('dotnet nuget list source --format short', (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                if (stderr) {
                    reject(stderr);
                    return;
                }
                // Parse the output and extract the enabled source URLs
                const sources = stdout.split('\r\n')
                    .map(source => source.trim())
                    .filter(source => source && !source.startsWith('---') && !source.startsWith('Source') && source.startsWith('E '))
                    .map(source => source.substring(2));
                resolve(sources);
            });
        });
    });
}
exports.getDotnetSources = getDotnetSources;
function getSubmodules() {
    return __awaiter(this, void 0, void 0, function* () {
        const output = (0, child_process_2.execSync)('git submodule status --recursive');
        const submoduleLines = output.toString().split('\n');
        const submodules = [];
        submoduleLines.forEach((line) => {
            if (line.length > 0) {
                const parts = line.trim().split(/ +/);
                const sha = parts[0];
                const url = parts[1];
                const name = url.split('/').slice(-1)[0].replace(/.git$/, '');
                const path = parts[2];
                submodules.push({
                    name, path, url, sha,
                });
            }
        });
        const internSubmodule = [];
        const externSubmodule = [];
        submodules.forEach((submodule) => {
            const isInternal = submoduleURLs.some(url => submodule.url.includes(url));
            if (isInternal) {
                externSubmodule.push(submodule);
            }
            else {
                internSubmodule.push(submodule);
            }
        });
        return { intern: internSubmodule, extern: externSubmodule };
    });
}
// =====================================================
function findALLCSPROJmodules() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            // Checkout the repository including submodules
            const submoduleUpdate = (0, child_process_1.spawn)('git', ['submodule', 'update', '--init', '--recursive']);
            submoduleUpdate.on('close', (code) => {
                if (code !== 0) {
                    reject(`git submodule update exited with code ${code}`);
                    return;
                }
                // Find all csproj files
                const find = (0, child_process_1.spawn)('find', ['.', '-name', '*.csproj']);
                let csprojFiles = '';
                find.stdout.on('data', (data) => {
                    csprojFiles += data;
                });
                find.on('close', (code) => {
                    if (code !== 0) {
                        reject(`find exited with code ${code}`);
                        return;
                    }
                    // Split the list of `csproj` files into an array of strings
                    const csprojFileList = csprojFiles.trim().split('\n');
                    // Output the list of `csproj` files found
                    //core.info(`List of csproj files found: ${csprojFileList}`);
                    resolve(csprojFileList);
                });
            });
        });
    });
}
exports.findALLCSPROJmodules = findALLCSPROJmodules;
//======================funktioniert =============================
// async function getAllNuGetPackages(projectList: string[], sourceList: string[]): Promise<AllNugetPackageInfo[]> {
//   const allPackages: AllNugetPackageInfo[] = [];
//   for (const project of projectList) {
//     for (const source of sourceList) {
//       const output = child_process.execSync(`dotnet list ${project} package --source ${source}`);
//       const lines = output.toString().split('\n');
//       let packageName: string = '';
//       let currentVersion: string = '';
//       for (const line of lines) {
//         if (line.includes('Project')) {
//         } else if (line.includes('>')) {
//           const parts = line.split(/ +/);
//           packageName = parts[2];
//           currentVersion = parts[3];
//           allPackages.push({ project, source, packageName, currentVersion });
//         }
//       }
//     }
//   }
//   return allPackages;
// }
function getAllNuGetPackages(projectList, sourceList) {
    return __awaiter(this, void 0, void 0, function* () {
        const allPackages = [];
        for (const project of projectList) {
            for (const source of sourceList) {
                const output = child_process.execSync(`dotnet list ${project} package --source ${source}`);
                const lines = output.toString().split('\n');
                let name = '';
                let currentVersion = '';
                for (const line of lines) {
                    if (line.includes('Project')) {
                    }
                    else if (line.includes('>')) {
                        const parts = line.split(/ +/);
                        name = parts[2];
                        currentVersion = parts[3];
                        allPackages.push({ project, source, name, currentVersion });
                    }
                }
            }
        }
        const internPackages = [];
        const externPackages = [];
        allPackages.forEach((packageInfo) => {
            const isInternal = sources.some(source => packageInfo.source.includes(source));
            if (isInternal) {
                internPackages.push(packageInfo);
            }
            else {
                externPackages.push(packageInfo);
            }
        });
        return { intern: internPackages, extern: externPackages };
    });
}
