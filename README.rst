=================================
CTFC Commitment of Traders Viewer
=================================

A viewer for the public domain `Commitment of Traders reports from the CFTC <https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm>`_. The Commitment of Traders report is a weekly summary of positioning in the futures market partitioned by various groups of traders.

All alternatives were either paid or lacking features. This is a data analysis and charting suite for the Commitment of Traders reports, completely free and open source.

The CFTC's data is free and public domain. This software just tries to make it useful.

Try it out!
-----------

👉  Live at `cot.libhack.so <https://cot.libhack.so>`_  👈

Features
--------

- Multiple charts dissecting the data in multiple ways:
   - Net positions: Long Positions minus Short Positions
   - Net positioning charts divided by percentage of total open interest
   - Net positioning charts z-scored with a lookback period you can tune with a slider
   - All three types of reports by the CFTC: Traders in Financial Futures (for e.g., bond and stock index futures), Disaggregated (for agricultural and natural resource commodities), Legacy (all of the above but in a different format)
   - Visualize changes in positioning over time. You can check how, for example, Leveraged Funds changed positioning on 10Y Treasury futures in the past 2 weeks, 26 weeks, ...
- Emphasis on net position (longs minus shorts)
- Charts with oscillators showing the degree to which one group of traders is positioned
- Normalizing lookback periods with Z-scores, Min-Max Scaling, Robust Scaling, Percentile Scaling
- Some price charts integrated into charts where available (public domain sources)
- Entirely client-side. Caches COT data to your browser storage to limit requests to the CFTC's API.
- There is no server-side software required to run, which is great for maintainability and longevity of this project.
- Free and open source software!

Alternatives
------------

- `Tradingster <https://www.tradingster.com/cot/futures>`_
- `Barchart <https://www.barchart.com/forex/commitment-of-traders>`_
- `Nasdaq Data Link <https://data.nasdaq.com/data/CFTC-commodity-futures-trading-commission-reports/documentation>`_
- `Cotpricecharts.com <https://cotpricecharts.com/commitmentscurrent/>`_


Installation (Advanced)
-----------------------

This builds as a fully static site, fully client-side.

Requires Node.js and a Node package manager such as `npm`, `yarn` or `pnpm`:

.. code-block:: bash

    git clone https://github.com/proprietary/cftc-cot-viewer.git && \
        cd cftc-cot-viewer && \
        npm install && \
        npm run build

The static site files will be generated in `out/`. You can serve that directory on a web server directly (I recommend `Caddy <https://caddyserver.com/>`_ or `nginx <https://wiki.archlinux.org/title/Nginx>`_), or locally, or using Docker for example, via:

.. code-block:: bash

    python3 -m http.server -d out
.. code-block:: bash

.. code-block:: bash

  git clone https://github.com/proprietary/cftc-cot-viewer.git 
 cd cftc-cot-viewer 
  docker build -t cotviewer-app
  docker run -p 8080:80 cotviewer-app

The static site will be avialble at the host machine port 8080 :

.. code-block:: bash

++++++++++++
Contributing
++++++++++++

Built with:

- TypeScript
- Next.js / React
- Apache eCharts

+++++++++++++
Documentation
+++++++++++++

- `COT Primer <doc/COT_Primer.rst>`_

License
-------

Apache-2.0
