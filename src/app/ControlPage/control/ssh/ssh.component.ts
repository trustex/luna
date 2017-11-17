/**
 * WebTerminal
 *
 * @date     2017-11-07
 * @author   liuzheng <liuzheng712@gmail.com>
 */

import {Component, OnInit} from '@angular/core';
import {Logger} from 'angular2-logger/core';
import * as io from 'socket.io-client';
import {Cookie} from 'ng2-cookies/ng2-cookies';

declare let jQuery: any;
declare let Terminal: any;
import {AppService, DataStore} from '../../../app.service';
import {NavList, View, Term} from '../control.component';


@Component({
  selector: 'app-ssh',
  templateUrl: './ssh.component.html',
  styleUrls: ['./ssh.component.css']
})
export class SshComponent implements OnInit {
  NavList = NavList;

  constructor(private _appService: AppService,
              private _logger: Logger) {
    this._logger.log('SshComponent.ts:SshComponent');
  }

  ngOnInit() {
  }

  TerminalConnect(host,username) {
    let socket = io.connect();
    let cols = '80';
    let rows = '24';
    if (Cookie.get('cols')) {
      cols = Cookie.get('cols');
    }
    if (Cookie.get('rows')) {
      rows = Cookie.get('rows');
    }
    Cookie.set('cols', cols, 99, '/', document.domain);
    Cookie.set('rows', rows, 99, '/', document.domain);


    let id = NavList.List.length - 1;
    NavList.List[id].nick = host.name;
    NavList.List[id].connected = true;
    NavList.List[id].edit = false;
    NavList.List[id].closed = false;
    NavList.List[id].type = "ssh";
    NavList.List[id].Term = new Term;
    NavList.List[id].Term.machine = host.uuid;
    NavList.List[id].Term.socket = socket;
    NavList.List[id].Term.term = new Terminal({
      cols: cols,
      rows: rows,
      useStyle: true,
      screenKeys: true,
    });
    NavList.List.push(new View());
    for (let m in NavList.List) {
      NavList.List[m].hide = true;
    }
    NavList.List[id].hide = false;

    NavList.Active = id;


    // TermStore.term[id]['term'].on('title', function (title) {
    //   document.title = title;
    // });

    NavList.List[id].Term.term.open(document.getElementById('term-' + id), true);

    NavList.List[id].Term.term.write('\x1b[31mWelcome to Jumpserver!\x1b[m\r\n');

    socket.on('connect', function () {
      socket.emit('login', "root");
      socket.emit('machine', host.uuid);

      NavList.List[id].Term.term.on('data', function (data) {
        socket.emit('data', data);
      });


      socket.on('data', function (data) {
        NavList.List[id].Term.term.write(data);
      });

      socket.on('disconnect', function () {
        this.TerminalDisconnect(id);
        // TermStore.term[id]["term"].destroy();
        // TermStore.term[id]["connected"] = false;
      });

      window.onresize = function () {
        let col = Math.floor(jQuery('#term').width() / jQuery('#liuzheng').width() * 8) - 3;
        let row = Math.floor(jQuery('#term').height() / jQuery('#liuzheng').height()) - 5;
        let rows = 24;
        let cols = 80;

        if (Cookie.get('rows')) {
          rows = parseInt(Cookie.get('rows'));
        }
        if (Cookie.get('cols')) {
          cols = parseInt(Cookie.get('cols'));
        }
        if (col < 80) col = 80;
        if (row < 24) row = 24;
        if (cols == col && row == rows) {
        } else {
          for (let tid in NavList.List) {
            if (NavList.List[tid].connected) {
              NavList.List[tid].Term.socket.emit('resize', [col, row]);
              NavList.List[tid].Term.term.resize(col, row);
            }
          }
          Cookie.set('cols', String(col), 99, '/', document.domain);
          Cookie.set('rows', String(row), 99, '/', document.domain);
        }
      };
      jQuery(window).resize();
    });

  }

  static TerminalDisconnect(host) {
    host.connected = false;
    host.Term.socket.destroy();
    host.Term.term.write('\r\n\x1b[31mBye Bye!\x1b[m\r\n');
  }

  static TerminalDisconnectAll() {
    alert("TerminalDisconnectAll");
    for (let i in NavList.List) {
      SshComponent.TerminalDisconnect(i);
      // TermStore.term[i]["connected"] = false;
      // TermStore.term[i]["socket"].destroy();
      // TermStore.term[i]["term"].write('\r\n\x1b[31mBye Bye!\x1b[m\r\n');
    }
  }
}