/**
 *  Redis Example
 * 
 *      Return AWS DynamoDB Results based on GeoLocation of endpoint hit
 * 
 *  Version     Date        Auther              Notes
 *      0.1     02/08/23    Barry Solomon       Initial Version
 * 
 *  Notes
 * 
 *      If env var DYNAMO_TABLENAME is set then that table will be retrieved
 * 
 *      If a DynamoDB is not accessible then there is a bug that will crash the express service.  This can be used to show container restarts in Grafana
 * 
 *      Required npm packages (if running locally)
 *          npm install express 
 *          npm install ejs 
 * 
 *      Example cpln commands for image and workload creation
 * 
 *          cpln image build --push --org initech --name dynamo-db-example:0.9
 *          cpln workload force-redeployment bds-dynamo-dev --org initech --gvc bds-dev
 *
 *          cpln image build --push --org initech --name dynamo-db-example:0.9 && cpln workload force-redeployment dynamo-prod --org initech --gvc bds-prod
 *
 **/

// const os = require('os');
// const express = require("express");

import { redisKeyValueGet } from './redis-client.js';
import os from 'os';
import express from 'express';
import ejs from 'ejs';

const HOSTNAME = os.hostname();
const PORT = process.env.PORT || 8081 // PORT is set automatically if running from ControlPlane
const SERVER_VERSION = "0.2.3";
const CPLN_LOCATION = process.env?.CPLN_LOCATION?.split('/').pop() || HOSTNAME;

console.log(`CPLN_LOCATION: ${process.env?.CPLN_LOCATION}`);

const regions = [
    {
        "kind": "location",
        "name": "aws-eu-central-1",
        "description": "AWS, Europe (Frankfurt)",
        "tags": {
            "cpln/city": "Frankfurt",
            "cpln/continent": "Europe",
            "cpln/country": "Germany"
        },
        "origin": "builtin",
        "provider": "aws",
        "region": "eu-central-1",
        "color": 'gray',
    },
    {
        "kind": "location",
        "name": "aws-sa-east-1",
        "description": "AWS, South America (São Paulo)",
        "tags": {
            "cpln/city": "São Paulo",
            "cpln/continent": "South America",
            "cpln/country": "Brazil"
        },
        "origin": "builtin",
        "provider": "aws",
        "region": "sa-east-1",
        "color": 'gray',
    },
    {
        "kind": "location",
        "name": "aws-us-east-2",
        "description": "AWS, US East (Ohio)",
        "tags": {
            "cpln/continent": "North America",
            "cpln/country": "USA",
            "cpln/state": "OH"
        },
        "origin": "builtin",
        "provider": "aws",
        "region": "us-east-2",
        "color": 'gray',
    },
    {
        "kind": "location",
        "name": "aws-us-west-2",
        "description": "AWS, US West (Oregon)",
        "tags": {
            "cpln/continent": "North America",
            "cpln/country": "USA",
            "cpln/state": "OR"
        },
        "origin": "builtin",
        "provider": "aws",
        "region": "us-west-2",
        "color": 'gray',
    },
    {
        "kind": "location",
        "name": "azure-centralus",
        "description": "Azure, Central US",
        "tags": {
            "cpln/continent": "North America",
            "cpln/country": "USA",
            "cpln/state": "IA"
        },
        "origin": "builtin",
        "provider": "azure",
        "region": "centralus",
        "color": 'gray',
    },
    {
        "kind": "location",
        "name": "azure-eastus2",
        "description": "Azure, East US 2",
        "tags": {
            "cpln/continent": "North America",
            "cpln/country": "USA",
            "cpln/state": "VA"
        },
        "origin": "builtin",
        "provider": "azure",
        "region": "eastus2",
        "color": 'gray',
    },
    {
        "kind": "location",
        "name": "gcp-me-west1",
        "description": "GCP, Tel Aviv, Israel, Middle East",
        "tags": {
            "cpln/city": "Tel Aviv",
            "cpln/continent": "Middle East",
            "cpln/country": "Israel"
        },
        "origin": "builtin",
        "provider": "gcp",
        "region": "me-west1",
        "color": 'gray',
    },
    {
        "kind": "location",
        "name": "gcp-us-central1",
        "description": "GCP, Council Bluffs, Iowa, USA",
        "tags": {
            "cpln/city": "Council Bluffs",
            "cpln/continent": "North America",
            "cpln/country": "USA",
            "cpln/state": "IA"
        },
        "origin": "builtin",
        "provider": "gcp",
        "region": "us-central1",
        "color": 'gray',
    },
    {
        "kind": "location",
        "name": "gcp-us-east1",
        "description": "GCP, Moncks Corner, South Carolina, USA",
        "tags": {
            "cpln/city": "Moncks Corner",
            "cpln/continent": "North America",
            "cpln/country": "USA",
            "cpln/state": "SC"
        },
        "origin": "builtin",
        "provider": "gcp",
        "region": "us-east1",
        "color": 'gray',
    }
];

function environmentVariables() {

    let env_list = [];

    const ordered = Object.keys(process.env).sort().reduce(
        (obj, key) => {
            env_list.push({ name: key, value: process.env[key] });
            obj[key] = process.env[key];
            return obj;
        },
        {}
    );
    console.log(JSON.stringify(ordered, null, 4));

    // var myArgs = process.argv;
    // var newDate = new Date();
    // + '<br/><br/>Arguments:<br/><br/>' + myArgs + '<br/><br/>Welcome to CPLN! The time is: ' + newDate.toUTCString() + "</div>";

    return (env_list);

}

var accordionData = [
    {
        header: "Environment Variable",
        items: [
            { name: "Item 2.1", "value": "testing" },
            { name: "Item 2.2", "value": "testing" },
            { name: "Item 2.3", "value": "testing" }
        ],
        body: ""
    },
    // ...
];

const accordionTemplate = `

    <div class="accordion-container">
      <% for (let section of accordionData) { %>
        <div class="accordion-header">
          <%= section.header %>
        </div>
        <div class="accordion-body">
        <ul>
          <% for (let item of section.items) { %>
            <li><%= item.name %> = <%= item.value %></li>
          <% } %>
        </ul>
        <%= section.body %>
      </div>
      <% } %>
    </div>
    
    <style>
      .accordion-container {
        width: 80%;
        margin: 0 auto;
      }
      
      .accordion-header {
        background-color: lightgray;
        cursor: pointer;
        padding: 18px;
      }
      
      .accordion-body {
        background-color: white;
        padding: 18px;
        display: none;
      }
    </style>
    
    <script>
      const accordionHeaders = document.querySelectorAll(".accordion-header");
      accordionHeaders.forEach(header => {
        header.addEventListener("click", function() {
          this.nextElementSibling.classList.toggle("active");
          
          let body = this.nextElementSibling;
          if (body.style.display === "block") {
            body.style.display = "none";
          } else {
            body.style.display = "block";
          }
        });
      });
    </script>
  `;

function environmentVariableAccordian(res) {

    accordionData[0].header = "Environment Variables";
    accordionData[0].items = environmentVariables();
    var accordionHTML = ejs.render(accordionTemplate, { accordionData });

    res.write(accordionHTML);
    //console.log(accordionHTML);

}

function highlightRegion(currentRegion) {

    let region_map_html = '<h4>GVC Locations:</h4><ul>';

    regions.forEach(region => {
        region_map_html += `<li style="color: ${(region.name === currentRegion) ? 'green' : 'grey'}; font-weight: ${(region.name === currentRegion) ? 'bold' : 'normal'}">${region.name}</li>`;
    });
    region_map_html += `<li style="color: ${(currentRegion === HOSTNAME) ? 'blue' : 'grey'}; font-weight: ${(currentRegion === HOSTNAME) ? 'bold' : 'normal'}">${HOSTNAME}</li>`;
    region_map_html += '</ul>';

    return region_map_html;

}

function jsonToTable(tablename, json) {

    var table = "<table border=1>";

    table += `<caption><span style="color: blue; font-weight: bold">${tablename.toUpperCase()}:</span></caption>`;

    var cols = Object.keys(json[0]);

    table += "<tr>";
    for (var i = 0; i < cols.length; i++) {
        table += "<th>" + cols[i] + "</th>";
    }
    table += "</tr>";

    for (var i = 0; i < json.length; i++) {
        table += "<tr>";
        for (var j = 0; j < cols.length; j++) {
            table += "<td>" + json[i][cols[j]] + "</td>";
        }
        table += "</tr>";
    }

    table += "</table>";

    return table;
}

/****************** Start APP *****************/
var app = express();

/* request handlers
 */
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.get('/', (req, res) => {

    console.log("app.get('/', (req, res) => {");

    res.setHeader('Content-Type', 'text/html');
    res.statusCode = 200;

    // Environment Variable Accordian
    environmentVariableAccordian(res);
    res.write(highlightRegion(CPLN_LOCATION));

    let table_name = process.env?.DYNAMO_TABLENAME || req.params.item;

    if (table_name !== undefined) {
        new Promise((resolve, reject) => {
            dynamodb(table_name, resolve, reject);
            res.statusCode = 200;
        })
            .then((html_response) => {
                res.end(html_response);
            });
    }
    else {
        res.end();
    }

});

app.get('/:key', (req, res) => {

    console.log("app.get('/redis/:key', (req, res) => {");

    if (['favicon.ico'].includes(req.params.item))
        return;

    res.setHeader('Content-Type', 'text/html');

    let key = req.params.key || process.env?.REDIS_KEY;

    new Promise((resolve, reject) => {
        redisKeyValueGet(key, resolve, reject);
        res.statusCode = 200;
    })
        .then((html_response) => {

            res.write(html_response);

            // Environment Variable Accordian
            environmentVariableAccordian(res);
            res.end(highlightRegion(CPLN_LOCATION));

        })
        .catch((err) => {

            console.error(err.message);
            res.end(`${html_response}<br style="color:red;">Exception:<br/>${err.message}<br/>`);
            
        });

});


app.listen(PORT);
console.log(`Server version ${SERVER_VERSION} running at http://${HOSTNAME}:${PORT}`);


