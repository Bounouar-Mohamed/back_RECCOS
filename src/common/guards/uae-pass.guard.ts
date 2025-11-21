import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class UaePassAuthGuard extends AuthGuard('uae-pass') {}
















