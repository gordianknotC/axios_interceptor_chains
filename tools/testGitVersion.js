const path = require("path");
const colors = require('colors');
const Walk = require("@root/walk");
const shell = require("shelljs");
const fs = require("fs");
const gitCommitInfo = require("git-commit-info");
const latestCommit = gitCommitInfo();
const latestCommitDateTime = new Date(Date.parse(latestCommit.date));
const gitlog = require("gitlog").default;


const gitLogOptions = {
  repo: __dirname,
  number: 20,
  fields: ["hash", "abbrevHash", "subject", "authorName", "authorDateRel"],
  execOptions: { maxBuffer: 1000 * 1024 },
};

const remoteCommitLog = gitlog(gitLogOptions).map((_)=>{
  return{
    hash: _.hash,
    author: _.authorName,
    date: _.authorDateRel,
    message:   _.subject,
  }
});


function parseInputArg(){
  const args = process.argv.slice(2);
  const argMap = {};
  args.forEach((pairString)=>{
    const [key, val] = pairString.split("=");
    argMap[key] = val;
  });
  return argMap;
}

function showHelp(){
  if (process.argv.includes("--help")){
  }
}

function getCurrentBranch(){
  return shell.exec("git branch --show-current");
}

async function getGitLogs(){
  return shell.exec("git log");
}

function getBuildFolderPath(){
  const branchName = getCurrentBranch().toString().split("\n")[0];
  if (branchName.includes("/")){
    throw new Error("unexpected branchname:", branchName);
  }
  return branchName;
}

function getCurrentBuildCommitInfo(){
  const configPath = path.join(getBuildFolderPath(), "config.js");
  if (fs.existsSync(configPath)){
    const regex = new RegExp(/JSON.parse\(([^)]+)\)/g);
    const configJs = fs.readFileSync(configPath);
    const group = regex.exec(configJs);
    const commitObj = JSON.parse(JSON.parse(group[1].replace(/"/g, `\\"`).replace(/'/g, `"`)));
    return {
      hash: commitObj.hash,
      author: commitObj.author,
      date: commitObj.date,
      message: commitObj.message,
    }
  }else{
    return null
  }
}

function echoCurrentBuild(){
  // shell.echo("current build commit:".bgGrey, getCurrentBuildCommitInfo());
  // shell.echo("current branch:".bgGrey, getCurrentBranch().toString().bgBlue);
}

function echoOutdateInfo(){
  const currentBuildInfo = getCurrentBuildCommitInfo();
  console.log("currentBuildInfo:", currentBuildInfo);
  if (currentBuildInfo){
    const commitIndex = remoteCommitLog.findIndex((_)=> _.hash === currentBuildInfo.hash);
    if (commitIndex === 0){
      shell.echo("current build info:".bgGrey, "[LATEST]".cyanBG);
    }else{
      const head = remoteCommitLog.slice(0, commitIndex).map((_)=>`${_.date}\t${_.message}`.red);
      const last = remoteCommitLog.slice(commitIndex , commitIndex+ 1).map((_)=>`* ${_.date}\t${_.message}`.blue);

      shell.echo("current build info:".bgGrey, `[OUT DATE], leave ${commitIndex} commit behind`.red);
      shell.echo(
        [...head, ...last].join("\n")
      );
    }
  } else{
    shell.echo("current build info:".bgGrey, "[OUT DATE]".red);
  }
}

showHelp();
echoCurrentBuild();
echoOutdateInfo();
