#!/usr/bin/python3

import sys
import json
import requests
import re
import os

url = sys.argv[1]

myResponse = requests.get(url)

# For successful API call, response code will be 200 (OK)
if(myResponse.ok):

    jData = json.loads(myResponse.content.decode('utf-8'))

    frontend_branch_name = jData['head']['ref']
    frontend_commit_hash = jData['head']['sha']
    frontend_user = jData['head']['repo']['full_name'].split("/")[0].lower()
    frontend_repo_name = jData['head']['repo']['name']

    frontend_base_branch_name = jData['base']['ref']
    frontend_base_sha1 = jData['base']['sha']
    frontend_base_user = jData['base']['repo']['full_name'].split("/")[0].lower()
    frontend_base_repo_name = jData['base']['repo']['name']

    # By default a backend is selected that is identical to the base branch of the frontend
    # e.g. for a frontend PR based on rc, the rc backend is selected 
    backend_user = "cbioportal"
    backend_branch_name = frontend_base_branch_name

    frontend_group_id = "com.github."+frontend_user

    pr_state = ""
    if jData['mergeable_state'] == 'draft':
      pr_state = "draft"

    print(
      "export PULL_REQUEST_STATE="+ pr_state +"\n"
      "export FRONTEND_GROUPID="+ frontend_group_id +"\n"
      "export FRONTEND_BASE_BRANCH="+ frontend_base_branch_name +"\n"
      "export BACKEND_PROJECT_USERNAME="+ backend_user +"\n"
      "export BACKEND_BRANCH="+ backend_branch_name)

else:
  # If response code is not ok (200), print the resulting http error code with description
    myResponse.raise_for_status()