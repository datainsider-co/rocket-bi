pipeline {
    agent any

    tools {
        maven "M3"
    }

    stages {
        stage('build') {
            steps {
                sh './build.sh compile'
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
