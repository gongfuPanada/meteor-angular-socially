import * as angular from 'angular';
import * as angularMeteor from 'angular-meteor';
import * as uiRouter from 'angular-ui-router';
import { Component, Input, Output } from '@angular/core';
import { MeteorComponent } from 'angular2-meteor';
import { MdButton } from '@angular2-material/button';
import { MdInput } from '@angular2-material/input';
import { MdCheckbox } from '@angular2-material/checkbox';

import { Meteor } from 'meteor/meteor';

import template from './partyDetails.html';
import { Parties } from '../../../api/parties';
import PartyUninvited from '../partyUninvited/partyUninvited';
import PartyMap from '../partyMap/partyMap';
import { upgradeAdapter } from '../../upgradeAdapter';

@Component({
  template,
  selector: 'party-details',
  directives: [
    PartyUninvited,
    upgradeAdapter.upgradeNg1Component('partyMap'),
    MdButton,
    MdInput,
    MdCheckbox,
  ]
})
class PartyDetails extends MeteorComponent {
  @Input() partyId: string;
  @Output() party: Object = {};
  users: Object[];
  isLoggedIn: boolean;

  constructor() {
    super();

    this.subscribe('parties');
    this.subscribe('users');

    this.autorun(() => {
      this.party = Parties.findOne({
        _id: this.partyId
      });

      this.users = Meteor.users.find({}).fetch();

      this.isLoggedIn = !!Meteor.userId();
    }, true);
  }

  canInvite() {
    if (!this.party) {
      return false;
    }

    return !this.party.public && this.party.owner === Meteor.userId();
  }

  save() {
    Parties.update({
      _id: this.party._id
    }, {
      $set: {
        name: this.party.name,
        description: this.party.description,
        public: this.party.public,
        location: this.party.location
      }
    }, (error) => {
      if (error) {
        console.log('Oops, unable to update the party...');
      } else {
        console.log('Done!');
      }
    });
  }
}

const name = 'partyDetails';

// create a module
export default angular.module(name, [
  angularMeteor,
  uiRouter,
  PartyMap.name
]).directive(name, upgradeAdapter.downgradeNg2Component(PartyDetails))
  .config(config);

function config($stateProvider) {
  'ngInject';

  $stateProvider.state('partyDetails', {
    url: '/parties/:partyId',
    template: '<party-details [party-id]="partyDetailsRoute.partyId"></party-details>',
    controllerAs: 'partyDetailsRoute',
    controller: function($stateParams, $scope) {
      'ngInject';
      this.partyId = $stateParams.partyId;
    },
    resolve: {
      currentUser($q) {
        if (Meteor.userId() === null) {
          return $q.reject('AUTH_REQUIRED');
        } else {
          return $q.resolve();
        }
      }
    }
  });
}
