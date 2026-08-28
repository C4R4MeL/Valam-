import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !user.role) return false;
    
    // Support case-insensitive role matching
    const allowedRoles = roles.map(r => r.toUpperCase());
    const userRole = user.role.toUpperCase();
    
    return allowedRoles.includes(userRole);
  }
}
