#! /bin/sh

ffplay -fflags nobuffer -flags low_delay -framedrop udp://127.0.0.1:1234