
FROM debian:stable-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV DISPLAY=:99
ENV DEBUG_PORT=19222

# Install dependencies
RUN apt update && apt install -y \
    wget \
    xvfb \
    fonts-takao \
    fonts-liberation \
    libglib2.0-0 \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libgtk-3-0 \
    libgbm1 \
    libasound2 \
    squashfs-tools \
    socat

# Install Authy
RUN mkdir -p /root/authy
WORKDIR /root/authy
RUN wget https://api.snapcraft.io/api/v1/snaps/download/H8ZpNgIoPyvmkgxOWw5MSzsXK1wRZiHn_18.snap && \
    unsquashfs -q -f -d . *.snap && \
    rm -r command.sh data-dir desktop-common.sh desktop-gnome-specific.sh desktop-init.sh gnome-platform lib meta/snap.yaml usr *.snap && \
    mkdir -p ~/.local/share/applications && \
    install -Dm755 meta/gui/authy.desktop ~/.local/share/applications/authy.desktop
RUN ln -s /root/authy/authy /usr/bin/authy

# Cleanup
RUN rm -rf /var/lib/apt/lists/* /var/cache/apt/* 

WORKDIR /root

# Add entrypoint
COPY ./scripts/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# Add shell script
COPY ./scripts/shell.sh /usr/local/bin/shell.sh
RUN chmod +x /usr/local/bin/shell.sh
CMD ["/usr/local/bin/shell.sh"]