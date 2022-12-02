pipeline {
    agent any

    tools {
        jdk "jdk8"
        maven "M3"
    }

    environment {
        DOCKER_REGISTRY_HOST = 'https://registry.hub.docker.com'
        DOCKER_REGISTRY_CREDENTIAL = 'acc_datainsider_dockerhub'
    }

    stages {
        stage('build') {
            steps {
                sh './build.sh build'
            }
        }

        stage('deploy') {
            when {
                expression { BRANCH_NAME ==~ /(main|dev|setup_autodeploy)/ }
            }

            steps {
                docker.withRegistry(DOCKER_REGISTRY_HOST, DOCKER_REGISTRY_CREDENTIAL) {
                    sh "./build.sh -t $BRANCH_NAME push"
                }
            }
        }
    }

    post {
        success {
            slackSend(
                    color: 'good',
                    message: "[OSS] The pipeline ${currentBuild.fullDisplayName} completed successfully."
            )
        }
        failure {
            slackSend(
                    color: 'danger',
                    message: "[OSS] The pipeline ${currentBuild.fullDisplayName} failed. Build URL: ${BUILD_URL}"
            )
        }
    }
}
