pipeline {
    agent any

    tools {
        jdk "jdk8"
        maven "M3"
    }

    stages {
        stage('build') {
            steps {
                sh './build.sh build'
            }
        }
    }

    stages {
        stage('deploy') {
            when {
                expression { BRANCH_NAME ==~ /(main|dev|setup_autodeploy)/ }
            }

            steps {
                sh "./build.sh -t $BRANCH_NAME push"
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
