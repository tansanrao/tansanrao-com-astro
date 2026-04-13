---
title: 'Node.js Container Build and Deploy with Jenkins, Helm, Private Docker Registry and Kubernetes'
description: >-
  A guide to set up a CI/CD pipeline for a containerized Node.js application
  using Jenkins, Helm, a private Docker repository, and Kubernetes.
timestamp: 2021-05-14 11:30:00+00:00
updatedTimestamp: 2021-05-21 12:43:59+00:00
tags:
  - kubernetes
  - containers
  - archive
toc: true
draft: false
authors:
  - name: Tanuj Ravi Rao
    url: 'https://tansanrao.com'
---
> [!WARNING]
> This post was restored from the wayback machine archive using LLMs and lightly
> reformatted for this site. A lot of this could be outdated or plain wrong.

## Introduction

Hey everyone! This guide is going to walk you through setting up a Jenkins Blue
Ocean Pipeline to build a Node.js application, push it to a private repository,
and deploy it to Kubernetes using a basic Helm chart.

### What is currently set up?

- Ubuntu 20.04.2, 2 vCPU, 4 GB RAM, 50 GB storage. This is the recommended
  config for Jenkins.
- MicroK8s cluster. Refer to my Home Lab Infrastructure post
  [here](/blog/2021/04/home-lab-infrastructure/) for more details.
- Docker private repository. I am using Sonatype Nexus 3, but you can use any
  Docker registry.

### What do I want?

- Jenkins Blue Ocean Pipeline for building, publishing, and deploying a Node.js
  application
- Dockerfile for the application container image
- Helm chart for deploying to Kubernetes
- Docker and Jenkins

## Docker and Jenkins

### Installing Docker Engine and `kubectl`

These commands will check for and uninstall older versions of Docker, then
replace them with the latest Docker CE release for Ubuntu.

```bash
sudo apt-get remove docker docker-engine docker.io containerd runc

sudo apt-get install -y \
  apt-transport-https \
  ca-certificates \
  curl \
  gnupg-agent \
  software-properties-common

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

sudo add-apt-repository \
  "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) \
  stable"

sudo apt-get install -y docker-ce docker-ce-cli containerd.io

sudo usermod -aG docker <username>
```

Install `kubectl` with:

```bash
curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -

cat <<EOF | sudo tee /etc/apt/sources.list.d/kubernetes.list
deb https://apt.kubernetes.io/ kubernetes-xenial main
EOF

sudo apt-get update

sudo apt-get install -y kubectl
```

### Installing Jenkins and Java

Install Java 11 runtime for Jenkins:

```bash
sudo apt-get install openjdk-11-jdk
```

Install the LTS version of Jenkins using the following commands:

```bash
wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io.key | sudo apt-key add -
sudo sh -c 'echo deb https://pkg.jenkins.io/debian-stable binary/ > \
  /etc/apt/sources.list.d/jenkins.list'
sudo apt-get update
sudo apt-get install jenkins
```

Start Jenkins:

```bash
sudo systemctl start jenkins
```

Enable Jenkins to start on system boot:

```bash
sudo systemctl enable jenkins
```

Add the Jenkins user to the Docker group so that it can use Docker:

```bash
sudo usermod -aG docker jenkins
```

You may have to reboot for these changes to take effect.

Next, visit the Jenkins GUI in your browser on port `8080` by default and give
it the initial password. You can then set up Jenkins using the _Install
Suggested Plugins_ option to quickly get started.

### Installing Blue Ocean, Docker, and Kubernetes Plugins

- Go to **Manage Jenkins -> Manage Plugins**, then select the **Available** tab
- Check _Blue Ocean_, _Docker Pipeline_, _Kubernetes_, and _CloudBees Docker
  Build and Publish_, then choose _Download now and install after restart_
- Restart Jenkins after the plugins have downloaded

## Dockerfile for Application Container Image

Let's create the `Dockerfile` for our Node.js application. In this case, it is
an API server using Express.js written in TypeScript.

Create a file named `Dockerfile` in the application directory and add the
following:

```dockerfile
FROM node:14

# Create app directory
WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./

# Install node modules
RUN yarn install --frozen-lockfile

COPY dist/ ./

EXPOSE 3000

CMD ["node", "server.js"]
```

Here we are basing the container on the `node:14` image.

Then we create the app directory and copy over the `package.json` and
`yarn.lock` files.

If you are not using Yarn, you would be copying over `package.json` and
`package-lock.json` instead.

We then install the dependencies using either `yarn install` or `npm install`
based on the package manager you use.

Since this application is written in TypeScript and compiled, my compiled
Node.js application is in the `dist/` folder. You will have to copy over your
application code into the working directory.

Next, since this application was intended to run on port `3000`, we expose that
port on the container. Make sure you substitute this for the port number your
application runs on.

Lastly, we add the command the container uses to run the application. In this
case, it is `node server.js`.

## Jenkinsfile for Blue Ocean Pipeline

Let's write the `Jenkinsfile` for our pipeline.

Here is the final `Jenkinsfile` for everyone who wants to copy-paste and move
on with life. For everyone else, there is a step-by-step breakdown of the
pipeline after.

```groovy
pipeline {
  agent any
  stages {
    stage('Build') {
      agent {
        docker {
          image 'node:14-buster'
        }
      }
      steps {
        sh 'yarn install --frozen-lockfile'
        sh 'yarn run build'
        sh 'tar -cvf builtSources.tar ./dist/'
        stash(name: 'dist-files', includes: 'builtSources.tar', useDefaultExcludes: true)
      }
    }

    stage('Publish') {
      environment {
        registryCredential = 'docker-repo-jenkinsci'
      }
      steps {
        unstash 'dist-files'
        sh 'tar -xvf builtSources.tar'
        script {
          commitId = sh(returnStdout: true, script: 'git rev-parse --short HEAD')
          def appimage = docker.build imageName + ":" + commitId.trim()
          docker.withRegistry('https://docker.tansanrao.com', registryCredential) {
            appimage.push()
            if (env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'release') {
              appimage.push('latest')
              if (env.BRANCH_NAME == 'release') {
                appimage.push("release-" + "${COMMIT_SHA}")
              }
            }
          }
        }
      }
    }

    stage('Deploy Dev') {
      when {
        branch 'main'
      }
      environment {
        registryCredential = 'docker-repo-jenkinsci'
      }
      steps {
        script {
          commitId = sh(returnStdout: true, script: 'git rev-parse --short HEAD')
          commitId = commitId.trim()
          withKubeConfig(credentialsId: 'kubeconfig') {
            withCredentials(bindings: [usernamePassword(credentialsId: registryCredential, usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
              sh 'kubectl delete secret regcred --namespace=example-dev --ignore-not-found'
              sh 'kubectl create secret docker-registry regcred --namespace=example-dev --docker-server=https://docker.tansanrao.com --docker-username=$DOCKER_USERNAME --docker-password=$DOCKER_PASSWORD --docker-email=<your_email@example.com>'
            }
            sh "helm upgrade --set image.tag=${commitId} --install --wait dev-example-service ./chart --namespace example-dev"
          }
        }
      }
    }

    stage('Deploy Prod') {
      when {
        branch 'release'
      }
      environment {
        registryCredential = 'docker-repo-jenkinsci'
      }
      steps {
        script {
          commitId = sh(returnStdout: true, script: 'git rev-parse --short HEAD')
          commitId = commitId.trim()
          echo commitId
          withKubeConfig(credentialsId: 'kubeconfig') {
            withCredentials(bindings: [usernamePassword(credentialsId: registryCredential, usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
              sh 'kubectl delete secret regcred --namespace=example-prod --ignore-not-found'
              sh 'kubectl create secret docker-registry regcred --namespace=example-prod --docker-server=https://docker.tansanrao.com --docker-username=$DOCKER_USERNAME --docker-password=$DOCKER_PASSWORD --docker-email=<your_email@example.com>'
            }
            sh "helm upgrade --set image.tag=${commitId} --install --wait prod-example-service ./chart --namespace example-prod"
          }
        }
      }
    }
  }
  environment {
    imageName = 'example-service'
  }
}
```

Okay, that's a lot. Let's break it down.

#### Pipeline

```groovy
pipeline {
  agent any
  stages {
    ...
  }
  environment {
    ...
  }
}
```

The pipeline is the root element of our script. It contains the global agent in
which the pipeline can execute, the stages that are part of the pipeline, and
the common environment variables shared between all stages.

#### Stages

```groovy
stages {
  stage('Build') {
    ...
  }

  stage('Publish') {
    ...
  }

  stage('Deploy Dev') {
    ...
  }

  stage('Deploy Prod') {
    ...
  }
}
```

This pipeline has four stages:

- Build
- Publish
- Deploy Dev
- Deploy Prod

The _Build_ stage runs the actual build process and test cases, if any. The
_Publish_ stage handles packaging of the application code into a Docker image
and pushing it to the registry. The _Deploy Dev_ and _Deploy Prod_ branches are
conditional. They deploy the application to Kubernetes using Helm and execute
based on the branch currently being built.

##### Build Stage

```groovy
stage('Build') {
  agent {
    docker {
      image 'node:14-buster'
    }
  }
  steps {
    sh 'yarn install --frozen-lockfile'
    sh 'yarn run build'
    sh 'tar -cvf builtSources.tar ./dist/'
    stash(name: 'dist-files', includes: 'builtSources.tar', useDefaultExcludes: true)
  }
}
```

In this stage, we specify the agent, in this case the `node:14-buster` Docker
container. This tells Jenkins that all the steps in this stage are to be
executed inside the specified Docker container. Then we list the actual steps
needed to install Node dependencies and build the application. We then create a
tarball of the built sources and use `stash` to send it back to Jenkins for
safekeeping. This lets us persist the compiled code across stages running in
different agents.

##### Publish Stage

```groovy
stage('Publish') {
  environment {
    registryCredential = 'docker-repo-jenkinsci'
  }
  steps {
    unstash 'dist-files'
    sh 'tar -xvf builtSources.tar'
    script {
      commitId = sh(returnStdout: true, script: 'git rev-parse --short HEAD')
      def appimage = docker.build imageName + ":" + commitId.trim()
      docker.withRegistry('https://docker.tansanrao.com', registryCredential) {
        appimage.push()
        if (env.BRANCH_NAME == 'main' || env.BRANCH_NAME == 'release') {
          appimage.push('latest')
          if (env.BRANCH_NAME == 'release') {
            appimage.push("release-" + "${COMMIT_SHA}")
          }
        }
      }
    }
  }
}
```

Here, we set an environment variable that contains the name of the Jenkins
credential holding our Docker registry credentials. Then we have the actual
build steps. We unstash the sources and extract them. We then use a `script`
step to fetch the short `commitId` of the Git repo `HEAD`, use
`docker.build` to build the image, and use `docker.withRegistry()` to push the
image with any required tags.

In my case, I tag the image with `latest` if it was on the `main` or `release`
branch. I also tag it with a `release` tag when the build is for the `release`
branch.

##### Deploy Stage

```groovy
stage('Deploy Dev') {
  when {
    branch 'main'
  }
  environment {
    registryCredential = 'docker-repo-jenkinsci'
  }
  steps {
    script {
      commitId = sh(returnStdout: true, script: 'git rev-parse --short HEAD')
      commitId = commitId.trim()
      withKubeConfig(credentialsId: 'kubeconfig') {
        withCredentials(bindings: [usernamePassword(credentialsId: registryCredential, usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
          sh 'kubectl delete secret regcred --namespace=example-dev --ignore-not-found'
          sh 'kubectl create secret docker-registry regcred --namespace=example-dev --docker-server=https://docker.tansanrao.com --docker-username=$DOCKER_USERNAME --docker-password=$DOCKER_PASSWORD --docker-email=<your_email@example.com>'
        }
        sh "helm upgrade --set image.tag=${commitId} --install --wait dev-example-service ./chart --namespace example-dev"
      }
    }
  }
}
```

_Deploy Dev_ and _Deploy Prod_ essentially have the same steps. These stages
are conditional. _Deploy Dev_, shown above, executes only when the branch is
`main`. _Deploy Prod_ executes only when the branch is `release`.

In this stage, we use `withKubeConfig` to provide the kubeconfig from a Jenkins
credential. We use `withCredentials` to fetch the Docker registry credentials
and make them available as variables. We then use `kubectl` to delete the
secret containing credentials if it already exists. We also add the
registry credentials to a Kubernetes secret so that the deployment can use it
as an `imagePullSecret`. We then run `helm upgrade` to upgrade the application
release or create a new one if it is the first time.

## Helm Chart

Now that our `Jenkinsfile` is done, we need to create the Helm chart for the
pipeline to deploy.

Make sure you have Helm installed. If you do not, you can do so using the Snap
package for Ubuntu:

```bash
sudo snap install helm --classic
```

Let's create a chart based on the Helm starter chart. Make sure you run the
following in your application directory:

```bash
helm create chart
```

You will now have a `chart` directory containing all the files for your Helm
chart.

Edit `Chart.yaml` and update the chart name, app version, and chart version.

Edit `values.yaml` to add the proper image path and image pull secrets if you
are using a private repository:

```yaml
image:
  repository: docker.tansanrao.com/example-service
  pullPolicy: IfNotPresent
  # Overrides the image tag whose default is the chart appVersion.
  tag: "latest"

imagePullSecrets:
  - name: regcred
```

Create a service account and set a name:

```yaml
serviceAccount:
  # Specifies whether a service account should be created
  create: true
  # Annotations to add to the service account
  annotations: {}
  # The name of the service account to use.
  # If not set and create is true, a name is generated using the fullname template
  name: "example-service-sa"
```

Enable autoscaling if required. In this case, I am leaving it off by default.

```yaml
autoscaling:
  enabled: false
  minReplicas: 1
  maxReplicas: 100
  targetCPUUtilizationPercentage: 80
  # targetMemoryUtilizationPercentage: 80
```

Edit `templates/deployment.yaml` in the chart directory to change the port and
the liveness and readiness endpoints under the containers section of the YAML
file. My liveness and readiness endpoint is at `/healthz`, which is why I will
be using that. If you are not certain, leave it as `/`.

```yaml
ports:
  - name: http
    containerPort: 3000
    protocol: TCP
livenessProbe:
  httpGet:
    path: /healthz
    port: http
readinessProbe:
  httpGet:
    path: /healthz
    port: http
```

Once the Dockerfile, Jenkinsfile, and Helm files are ready, push the changes to
GitHub.

## Add Secrets to Jenkins

- From your dashboard, go to **Manage Jenkins -> Manage Credentials**
- Under _Stores scoped to Jenkins_, select **Jenkins**
- Select **Global Credentials (unrestricted)**
- On the left, select **Add Credentials**
- Create a credential of type _Username with password_ and add your Docker
  username and password. For the ID, I used `docker-repo-jenkinsci`

![Docker Registry Credentials](https://web.archive.org/web/20211204010112im_/https://tansanrao.com/content/images/2021/05/Screenshot-2021-05-13-at-4.18.17-PM.png)
*Docker Registry Credentials*

- Next, create another credential of type _Secret file_

![Kubeconfig Credential](https://web.archive.org/web/20211204010112im_/https://tansanrao.com/content/images/2021/05/Screenshot-2021-05-13-at-4.29.01-PM.png)
*Kubeconfig Credential*

## Connecting Blue Ocean to GitHub

- Click **Open Blue Ocean** in the sidebar of the dashboard
- Create a new pipeline
- Create a new GitHub access token and paste it in

![Create New Pipeline](https://web.archive.org/web/20211204010112im_/https://tansanrao.com/content/images/2021/05/Screenshot-2021-05-13-at-4.32.07-PM.png)
*Create New Pipeline*

- Choose your repository and run the pipeline

Done! You have successfully set up a pipeline to build, publish, and deploy
your code based on the VCS branch.
