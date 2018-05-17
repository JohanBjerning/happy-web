# happy-web

## happy-receiver.py ##
Small web server waiting for HTTP HEAD events coming from the Raspberry PI. When
the event is received the
```
/home/pi/happiness.csv
```
is downloaded and placed in the data folder. This causes a refresh on the chart.

The EVENT_TARGET in [testkey](https://github.com/sublibra/happy-pi/blob/master/testkey.py)
must point to the address of this server.
