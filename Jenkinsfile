pipeline {
    agent any

    tools {
        jdk "jdk8"
        maven "M3"
    }

    stages {
        stage('build') {
            steps {
                sh './build_all.sh build'
            }
        }

        stage('deploy') {
            when {
                anyOf {
                    expression { BRANCH_NAME ==~ /(main)/ }
                    buildingTag()
                }
            }

            steps {
                withCredentials([usernamePassword(credentialsId: 'acc_datainsider_dockerhub', passwordVariable: 'password', usernameVariable: 'username')]) {
                    sh "docker login -u $username -p $password "
                    sh "./build_all.sh -t $BRANCH_NAME push"
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
