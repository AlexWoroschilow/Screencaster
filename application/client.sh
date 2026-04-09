#! /bin/sh

ffplay -fflags nobuffer -flags low_delay -framedrop -strict experimental -i udp://192.168.2.83:1234?fifo_size=0&overrun_nonfatal=1