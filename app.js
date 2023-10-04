const { spawn } = require("child_process");
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors");
const multer = require("multer");
const readline = require("readline");
const crypto = require("crypto");
const app = express();

const upload = multer({ dest: "uploads/" });

let ovhAccounts = [];
let servers = {};

let ovhServers = {};

// Allow requests from a specific domain
const allowedOrigins = ["http://app.lastebest.art"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

// app.use((req, res, next) => {
//   const allowedDomains = allowedOrigins;
//   const { origin } = req.headers;
//   console.log(origin);
//   if (allowedDomains.includes(origin)) {
//     next();
//   } else {
//     res.status(403).json({ message: "Access Denied" });
//   }
// });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

fs.readFile("openstack/openstackAccounts.txt", "utf8", (err, data) => {
  if (err) {
    console.error("Error reading file:", err);
    return;
  }

  // Parse the JSON string into an object
  if (data) {
    const jsonObject = JSON.parse(data);
    ovhAccounts = jsonObject;
    // setInterval(getAllServers, 15000);
    // console.log(jsonObject);
  }
});


const deleteOpenStacksServers = async (openStackUser) => {
  let promises = [];
  for(let [region, servers] of Object.entries(ovhServers[openStackUser])){
    if (servers.length > 0) { // check if there are servers to delete
      process.env.region_ = region;
      const ids = servers.map(server => server.id);
      const command = `source openstack/${openStackUser}.sh >> auth.txt && openstack server delete ${ids.join(' ')}`;
      promises.push(new Promise((resolve, reject) => {
        const script = spawn('bash', ['-c', command]);
        script.stdout.on('data', (data) => {
          // output += data.toString();
        });
        script.stderr.on('data', (data) => {
          console.error(`Error: ${data}`);
          reject(data.toString());
        });
        script.on('close', code => {
          if (code !== 0) {
            reject(`Deletion Script exited with code ${code}`);
          } else {
            resolve();
          }
        });
      }))
    }
  }

  await Promise.all(promises);

  ovhServers = {};
  return true;
}




// const { spawn } = require('child_process');
const os = require('os');

const regions = ["BHS5", "DE1", "GRA11", "SBG5", "UK1", "WAW1", "SGP1", "SYD1"];

const getOpenStackServers = async () => {
  let servers = {};

  // create array of promises
  let promises = [];
  for(let i = 0; i < ovhAccounts.length; i++) {
    let user = ovhAccounts[i].openStackUser;
    for(let j = 0; j < regions.length; j++){
      let region = regions[j];
      promises.push(new Promise((resolve) => {
        const script = spawn('bash', ['-c', `source openstack/${user}.sh >> auth.txt && openstack server list --os-region-name ${region} --long --format json`]);
        let output = '';

        script.stdout.on('data', (data) => {
          output += data.toString();
          // console.log(output);
        });

        script.stderr.on('data', (data) => {
          console.error(`Error: ${data}`);
        });

        script.on('close', (code) => {
          if (code !== 0) {
            console.error(`Script for user ${user} and region ${region} exited with code ${code}`);
          } else {
            if (output) {
              const regionServers = JSON.parse(output.trim());
              if (!servers[user]) {
                servers[user] = {};
              }
              servers[user][region] = regionServers.map(server => ({name: server.Name, id: server.ID, status: server.Status, networks: server.Networks,image: server["Image Name"]}));
              
            }
          }
          resolve(); // resolve the promise regardless of the outcome
        });
      }));
    }
  }

  // await all promises to resolve
  await Promise.all(promises);
  return servers;
};


let isRunning = false;

const periodicFetch = async () => {
  if (!isRunning) {
    isRunning = true;
    try {
      ovhServers =  await getOpenStackServers();
      // console.log(ovhServers);
      console.log("Fetch complete");
    } catch (error) {
      console.error(`An error occurred while fetching servers: ${error}`);
    }
    isRunning = false;
  }
};

setInterval(periodicFetch, 15000);


const deleteOpenStackServers = async (openStackUser) => {
  try {
    console.log(openStackUser);
    
    const regions = ["BHS5", "DE1", "GRA11", "SBG5", "UK1", "WAW1", "SGP1", "SYD1"];
    let deletePromises = [];
    const accountRegionsServers = ovhServers[openStackUser];
    
    for(let [region,servers] of Object.entries(accountRegionsServers)){
      process.env.region_ = region;
      let getServersIds = [];
      let deleteCommand=  ['-c',`source openstack/${openStackUser}.sh >> auth.txt && openstack server delete`]
      for(let server of servers){
        getServersIds.push(server.id);
        }

        if(getServersIds.length === 0)
          continue;
          deleteCommand.push(getServersIds[0]);
          const script = spawn('bash',deleteCommand);
          let output = '';
  
          script.stdout.on('data', (data) => {
            output += data.toString();
          });
  
          script.stderr.on('data', (data) => {
            console.error(`Delete server Error: ${data}`);
            // return data.toString();
          });
  
          script.on('close', (code) => {
            if (code !== 0) {
              // return `Delete Server Script exited with code ${code}`;
            } else {
              // return true;
            }
          });

      
    }



  } catch (error) {
    console.error(`Error while deleting servers: ${error}`);
  }
};



// getOpenStackServers()
//   .then(servers => console.log(JSON.stringify(servers, null, 2)))
//   .catch(err => console.error(err));

const opensStackCommand = (
  openRcFileName,
  first_command,
  second_command,
  region
) => {
  return new Promise((resolve, reject) => {
    process.env.region_ = region;
    const source = spawn("bash", [
      "-c",
      `cd openstack && source ${openRcFileName}.sh && env`,
    ]);
    let env = "";

    source.stdout.on("data", (data) => {
      env += data;
      // console.log(data.toString());
    });

    source.stderr.on("data", (data) => {
      console.error(data.toString());
      resolve(false);
    });

    source.on("close", (code) => {
      if (code === 0) {
        const envVars = env.split("\n").reduce((acc, line) => {
          const [key, value] = line.split("=");
          acc[key] = value;
          return acc;
        }, {});

        Object.assign(process.env, envVars);
        const openstack = spawn(first_command, second_command);

        openstack.stdout.on("data", (data) => {
          // console.log(data.toString());
          resolve(data);
        });

        openstack.stderr.on("data", (data) => {
          console.error("Error: " + data.toString());
          resolve(false);
        });

        openstack.on("close", (code) => {
          if (code !== 0) {
            resolve(false);
          }
        });
      } else {
        console.error(`Failed to source OpenStack RC file. Exit code: ${code}`);
        resolve(false);
      }
    });
  });
};







const createInstance = async (
  openRcFileName,
  image,
  flavor,
  network,
  instanceName,
  region,
  numberOfInstances
) => {
  const firstCommand = "openstack";
  let confFile = 'cenroot.sh'
  if(image === 'Debian 10 - Docker')
    confFile = 'debian.sh'
  const createCommand = [
    "server",
    "create",
    "--key-name",
    "SSHKEY_2",
    "--flavor",
    flavor,
    "--network",
    "Ext-Net",
    "--user-data",
    "cenroot.sh",
    "--file",
    "/root/.ssh/authorized_keys=authorized_keys",
    "--os-region-name",
    region,
    "--image",
    image,
    "--min",
    numberOfInstances,
    "--max",
    numberOfInstances,
    instanceName,
  ];

  try {
    // Execute the OpenStack command to create the instance
    const success = await opensStackCommand(
      openRcFileName,
      firstCommand,
      createCommand,
      region
    );

    if (success) {
      // OpenStack command executed successfully
      // Retrieve server information using another OpenStack command
      const serverInfoCommand = ["server", "show", instanceName, "-f", "json"];
      const serverInfo = await opensStackCommand(
        openRcFileName,
        firstCommand,
        serverInfoCommand,
        region
      );

      if (serverInfo) {
        return "ok";
      }
    }
  } catch (error) {
    console.error("Error occurred:", error);
  }

  // If anything goes wrong, return null or an error message
  return null;
};

const accountServers = {
  "user-mj6hvhtDwSXg": {},
  "user-Ntdegwhn66aJ": {},
};

const getAllServers = async () => {
  const firstCommand = "openstack";
  const createCommand = ["server", "list", "--long", "-f", "json"];
  // console.log(ovhAccounts);
  ovhAccounts.forEach(async (account) => {
    // console.log("What");
    const openstack_regions = [
      "BHS5",
      "DE1",
      "GRA11",
      "SBG5",
      "UK1",
      "WAW1",
      "SGP1",
      "SYD1",
    ];

    const account_servers = {};
    openstack_regions.forEach(async (region) => {
      const success = await opensStackCommand(
        account.openStackUser,
        firstCommand,
        createCommand,
        region
      );
      // servers[region] = JSON.parse(success);
      // account_servers[region] = JSON.parse(success);
      accountServers[account.openStackUser][region] = JSON.parse(success);
    });
  });
};

app.post("/new-ovh-account", upload.single("openrc"), async (req, res) => {
  console.log(req.body)
  const openRcFile = req.file;
  const ovhEmail = req.body.email;
  const ovhPassword = req.body.password;
  const openStackUser = req.body.user;
  const fileStream = fs.createReadStream(openRcFile.path);
  const fileReader = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });
  let newOpenRcText = ""
  fileReader.on("line", async (line) => {
    
    if (!line.startsWith("#")) {
      if (line === "read -sr OS_PASSWORD_INPUT") {
        // console.log(line);
      } else if (line.includes("export OS_USERNAME")) {
        newOpenRcText =
          newOpenRcText + `export OS_USERNAME="${openStackUser}"` + "\n";
      } else if (line === "export OS_PASSWORD=$OS_PASSWORD_INPUT") {
        newOpenRcText =
          newOpenRcText + `export OS_PASSWORD=${ovhPassword}` + "\n";
      } else if (line.includes("export OS_REGION_NAME")) {
        newOpenRcText = newOpenRcText + "export OS_REGION_NAME=$region_" + "\n";
      } else {
        newOpenRcText = newOpenRcText + line + "\n";
      }
    }
  });

  fileReader.on("close", async () => {
    newOpenRcText =
      newOpenRcText +
      "if openstack keypair show SSHKEY_2 >/dev/null 2>&1; then" +
      "\n";
    newOpenRcText =
      newOpenRcText + `  export OS_SSH_KEY_NAME="SSHKEY_2"` + "\n";
    newOpenRcText = newOpenRcText + `else` + "\n";
    newOpenRcText =
      newOpenRcText +
      `  openstack keypair create --public-key ~/.ssh/id_rsa.pub SSHKEY_2` +
      "\n";
    newOpenRcText = newOpenRcText + `  export OS_SSH_KEY_NAME=SSHKEY` + "\n";
    newOpenRcText =
      newOpenRcText + `  echo "SSH keypair SSHKEY created."` + "\n";
    newOpenRcText = newOpenRcText + "fi" + "\n";

    fs.writeFile(
      `./openstack/${openStackUser}.sh`,
      newOpenRcText,
      async (err) => {
        if (err) {
          console.error("Error writing file:", err);
          return;
        }

        console.log("Data written to file successfully.");
        // const command_result = await opensStackCommand('openstack',['image','list'])

        try {
          const command_result = await opensStackCommand(
            openStackUser,
            "openstack",
            ["image", "list"],
            "BHS5"
          );
          console.log("maybe : " + command_result);
          // Handle the command result
          if (command_result) {
            const newOvhAccount = {
              id: openRcId,
              email: ovhEmail,
              password: ovhPassword,
              openStackUser,
              openStackPassword,
              path: `openstack/${openRcId}.sh`,
            };

            let foundIndex = ovhAccounts.findIndex(
              (ovhAccount) => ovhAccount.openStackUser === openStackUser
            );
            if (foundIndex !== -1) {
              ovhAccounts.splice(foundIndex, 1);
              ovhAccounts.push(newOvhAccount);
            } else {
              ovhAccounts.push(newOvhAccount);
            }

            fs.writeFile(
              `openstack/openstackAccounts.txt`,
              JSON.stringify(ovhAccounts),
              (err) => {
                if (err) {
                  console.error("Error writing file:", err);
                  return;
                }

                console.log("Data written to file successfully.");
              }
            );
          }
          res.send(command_result);
        } catch (error) {
          console.error("Error executing opensStackCommand:", error);
          // Handle the error gracefully without stopping the application
        }
        // console.log(command_result);
      }
    );
    // console.log(newOpenRcText);
  });

  // console.log(openStackUser);
  // console.log(openStackPassword);
});

app.get("/get-ovh-accounts", (req, res) => {
  try {
    // console.log(ovhAccounts);
    res.send(ovhAccounts);
  } catch (err) {
    res.send(err);
  }
});

app.post("/create-new-server", async (req, res) => {
  try {
    const {openRcFileName, image, flavor, network, region, instanceName, numberOfInstances} = req.body;
    const getOvhAccount = ovhAccounts.find(account => account.id === openRcFileName);
    const allRegions = ["BHS5", "DE1", "GRA11", "SBG5", "UK1", "WAW1", "SGP1", "SYD1"]; // specify your actual regions here
    const regionsToCreateIn = region === 'each' ? allRegions : [region.trim()];

    let serverInfos = [];

    for (const region of regionsToCreateIn) {
      const serverInfo = await createInstance(
        getOvhAccount.openStackUser,
        image,
        flavor,
        network,
        instanceName,
        region,
        numberOfInstances
      );
      serverInfos.push(serverInfo);
    }

    res.status(200).json(serverInfos);
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ error: "An error occurred while processing the request." });
  }
});


let howmanyRequest = 0;
app.post("/get-servers", async (req, res) => {
  console.log('get servers request ' + ++howmanyRequest);
  try {
    // const servers = await getOpenStackServers();
    // console.log(servers);
    res.json(ovhServers);
  } catch (error) {
    res.status(500).send({ error: 'An error occurred while fetching servers.' });
  }

  return;










  //   const serversFileName = `./openstack/${req.body.serverData.openStackUser}_servers.txt`;
  //   console.log(serversFileName);
  //   fs.access(serversFileName, fs.constants.F_OK, (err) => {
  //     if (err) {
  //         // console.error(`${serversFileName} does not exist.`);
  //         res.json([]);
  //         return;
  //     }

  //     fs.readFile(serversFileName, 'utf8', (err, data) => {
  //         // if (err) throw err;
  //         if (err) {
  //            res.json([]);
  //            return;
  //         };
  //         let objArray = JSON.parse(data);
  //         const getServersForAccount = objArray[req.body.serverData.openStackUser]
  //         res.json(getServersForAccount[req.body.serverData.current_region]);
  //         // console.log(objArray);
  //     });
  // });

  //   return;

  const serversForRequestAccount =
    accountServers[req.body.serverData.openStackUser];
  if (
    Object.keys(serversForRequestAccount).length === 0 ||
    serversForRequestAccount[req.body.serverData.current_region] ===
      undefined ||
    serversForRequestAccount[req.body.serverData.current_region].length === 0
  ) {
    res.json([]);
    return;
  }
  res.json(serversForRequestAccount[req.body.serverData.current_region]);
});

app.post("/delete-server", async (req, res) => {
  const firstCommand = "openstack";
  const createCommand = ["server", "delete", req.body.serverData.serverId];
  const serverData = req.body.serverData;
  const success = await opensStackCommand(
    serverData.openStackUser,
    firstCommand,
    createCommand,
    serverData.region
  );
  res.json(JSON.parse(success));
});

app.post("/delete-all-servers", async (req, res) => {


  await deleteOpenStacksServers(req.body.serverData.openStackUser);
  ovhServers = {};

  // const deleteServersResult = await deleteOpenStackServers(req.body.serverData.openStackUser);
  // accountServers[req.body.serverData.openStackUser] = {};



//   const openstack_regions = [
//     "BHS5",
//     "DE1",
//     "GRA11",
//     "SBG5",
//     "UK1",
//     "WAW1",
//     "SGP1",
//     "SYD1",
//   ];

//   const firstCommand = "openstack";
//   for(let [region,servers] of Object.entries(ovhServers[req.body.serverData.openStackUser])){
//    const createCommand = ["server","delete"];
//     servers.forEach(server =>{
//       createCommand.push(server.id);
//     })

//     if(createCommand.length > 2){
//       const deletionSuccess = await opensStackCommand(req.body.serverData.openStackUser,firstCommand,createCommand,region);

//     }


//   }
  
 

// return;

//   openstack_regions.forEach(async (region) => {
//     const getServerInfo =
//       ovhServers[req.body.serverData.openStackUser][region];
   
    
//     for(let servers of ovhServers[req.body.serverData.openStackUser][region]){
//       console.log(servers.length)
//     }
//     for(let [region,servers] of Object.entries(ovhServers[req.body.serverData.openStackUser])){
//       servers.forEach((server) => {
//         createCommand.push(server.id);
//       });
//     }

//     if (createCommand.length > 2) {
//       console.log(createCommand);
//       const success = await opensStackCommand(
//         req.body.serverData.openStackUser,
//         firstCommand,
//         createCommand,
//         region
//       );
//     }
//   });

  res.json({ message: "Server delete started wait 10 seconds please" });
});

app.listen(3000, () => console.log(`Server listening on port 3000`));
