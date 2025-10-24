import React, { useState } from 'react';
import { useAppStore } from '@/store/main';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Navigate } from 'react-router-dom';