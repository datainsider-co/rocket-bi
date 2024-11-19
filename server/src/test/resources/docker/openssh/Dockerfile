FROM ubuntu:20.04

RUN apt update && apt install  openssh-server sudo -y
RUN groupadd sshgroup && useradd -ms /bin/bash -g sshgroup di
RUN mkdir -p /home/di/.ssh
COPY id_rsa.pub /home/di/.ssh/authorized_keys
RUN chown di:sshgroup /home/di/.ssh/authorized_keys && chmod 600 /home/di/.ssh/authorized_keys
RUN service ssh start
EXPOSE 22

CMD ["/usr/sbin/sshd","-D"]
